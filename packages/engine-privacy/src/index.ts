export type CardNetwork =
    | "visa"
    | "mastercard"
    | "amex"
    | "discover"
    | "diners"
    | "jcb"
    | "unknown";

export interface LuhnValidationResult {
    isValid: boolean;
    network: CardNetwork;
    maskedNumber: string;
    digitCount: number;
}

export type RedactionMode = "placeholder" | "mask" | "hash";

export type PiiCategory =
    | "email"
    | "phone"
    | "ssn"
    | "credit_card"
    | "ipv4"
    | "api_key";

export interface RedactTextRequest {
    text: string;
    mode?: RedactionMode;
    categories?: PiiCategory[];
}

export interface RedactionMatch {
    category: PiiCategory;
    replacement: string;
}

export interface RedactTextResult {
    sanitizedText: string;
    redactionCount: number;
    countsByCategory: Record<PiiCategory, number>;
    matches: RedactionMatch[];
}

export interface MaskJsonRequest {
    payload: unknown;
    sensitiveKeys?: string[];
}

export interface MaskJsonResult {
    maskedPayload: unknown;
    maskedFieldCount: number;
    maskedPaths: string[];
}

/** Deterministic, zero-dependency FNV-1a 32-bit hex digest (safe in browser & Node) */
function fnv1aHex(str: string): string {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
}

export function identifyCardNetwork(digits: string): CardNetwork {
    if (/^4\d{12}(\d{3})?(\d{3})?$/.test(digits)) return "visa";
    if (/^(5[1-5]\d{14}|2(2[2-9][1-9]|2[3-9]\d|[3-6]\d{2}|7[01]\d|720)\d{12})$/.test(digits)) {
        return "mastercard";
    }
    if (/^3[47]\d{13}$/.test(digits)) return "amex";
    if (/^6(?:011|5\d{2}|4[4-9]\d)\d{12,15}$/.test(digits)) return "discover";
    if (/^3(?:0[0-5]|[68]\d)\d{11}$/.test(digits)) return "diners";
    if (/^(?:2131|1800|35\d{3})\d{11}$/.test(digits)) return "jcb";
    return "unknown";
}

export function validateLuhn(input: string): LuhnValidationResult {
    const digits = (input || "").replace(/[\s\-]/g, "");

    if (!/^\d{12,19}$/.test(digits)) {
        return {
            isValid: false,
            network: "unknown",
            maskedNumber: "****",
            digitCount: digits.length,
        };
    }

    let sum = 0;
    let shouldDouble = false;

    for (let i = digits.length - 1; i >= 0; i--) {
        let digit = parseInt(digits.charAt(i), 10);
        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
        shouldDouble = !shouldDouble;
    }

    const isValid = sum % 10 === 0;
    const last4 = digits.slice(-4);
    const maskedNumber = `${"*".repeat(Math.max(0, digits.length - 4))}${last4}`;

    return {
        isValid,
        network: isValid ? identifyCardNetwork(digits) : "unknown",
        maskedNumber,
        digitCount: digits.length,
    };
}

function formatReplacement(
    raw: string,
    category: PiiCategory,
    mode: RedactionMode
): string {
    if (mode === "placeholder") {
        return `[REDACTED_${category.toUpperCase()}]`;
    }
    if (mode === "hash") {
        return `[${category.toUpperCase()}:${fnv1aHex(raw)}]`;
    }

    // Mask mode: preserve minimal safe context
    switch (category) {
        case "email": {
            const [local, domain] = raw.split("@");
            if (!domain) return "***@***";
            const visibleLocal = local.length > 1 ? local[0] : "*";
            return `${visibleLocal}***@${domain}`;
        }
        case "credit_card": {
            const digits = raw.replace(/\D/g, "");
            return `****-****-****-${digits.slice(-4)}`;
        }
        case "ssn":
            return `***-**-${raw.replace(/\D/g, "").slice(-4)}`;
        case "phone": {
            const digits = raw.replace(/\D/g, "");
            return `(***) ***-${digits.slice(-4)}`;
        }
        case "ipv4": {
            const octets = raw.split(".");
            return `${octets[0]}.***.***.***`;
        }
        case "api_key":
            return `${raw.slice(0, 6)}...${raw.slice(-4)}`;
    }
}

export function redactText(params: RedactTextRequest): RedactTextResult {
    const mode: RedactionMode = params.mode || "placeholder";
    const enabledCategories = new Set<PiiCategory>(
        params.categories || ["email", "phone", "ssn", "credit_card", "ipv4", "api_key"]
    );

    let sanitizedText = params.text ?? "";
    const countsByCategory: Record<PiiCategory, number> = {
        email: 0,
        phone: 0,
        ssn: 0,
        credit_card: 0,
        ipv4: 0,
        api_key: 0,
    };
    const matches: RedactionMatch[] = [];

    const applyRule = (
        category: PiiCategory,
        regex: RegExp,
        validator?: (match: string) => boolean
    ) => {
        if (!enabledCategories.has(category)) return;

        sanitizedText = sanitizedText.replace(regex, (fullMatch) => {
            if (validator && !validator(fullMatch)) {
                return fullMatch;
            }
            const replacement = formatReplacement(fullMatch, category, mode);
            countsByCategory[category]++;
            matches.push({ category, replacement });
            return replacement;
        });
    };

    // 1. API Keys / Bearer Tokens (sk_live_..., ap_live_..., ghp_..., etc.)
    applyRule(
        "api_key",
        /\b(?:sk_live|sk_test|pk_live|pk_test|ap_live|ap_test|ghp|xoxb|xoxp|AIza)[_\-a-zA-Z0-9]{12,64}\b/g
    );

    // 2. Credit cards (13-19 digits with optional spaces or dashes, Luhn validated)
    applyRule(
        "credit_card",
        /\b(?:\d[ -]*?){13,19}\b/g,
        (candidate) => validateLuhn(candidate).isValid
    );

    // 3. US SSN (XXX-XX-XXXX)
    applyRule(
        "ssn",
        /\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g
    );

    // 4. Email addresses
    applyRule(
        "email",
        /\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b/g
    );

    // 5. Phone numbers (US & international formats)
    applyRule(
        "phone",
        /(?:\+\d{1,2}\s?)?\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}\b/g
    );

    // 6. IPv4 addresses
    applyRule(
        "ipv4",
        /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g
    );

    const redactionCount = matches.length;

    return {
        sanitizedText,
        redactionCount,
        countsByCategory,
        matches,
    };
}

const DEFAULT_SENSITIVE_KEYS = [
    "password",
    "passcode",
    "secret",
    "client_secret",
    "token",
    "access_token",
    "refresh_token",
    "api_key",
    "apikey",
    "authorization",
    "ssn",
    "cvv",
    "cvc",
    "pin",
    "private_key",
];

export function maskJsonPayload(params: MaskJsonRequest): MaskJsonResult {
    const customKeys = (params.sensitiveKeys || DEFAULT_SENSITIVE_KEYS).map((k) =>
        k.toLowerCase()
    );
    const maskedPaths: string[] = [];

    function maskPrimitiveValue(val: unknown): string {
        if (val === null || val === undefined) return "***";
        const str = String(val);
        if (str.length <= 4) return "****";
        return `${str.slice(0, 2)}${"*".repeat(Math.min(8, str.length - 4))}${str.slice(-2)}`;
    }

    function traverse(node: unknown, currentPath: string): unknown {
        if (node === null || node === undefined) return node;
        if (Array.isArray(node)) {
            return node.map((item, idx) => traverse(item, `${currentPath}[${idx}]`));
        }
        if (typeof node === "object") {
            const obj = node as Record<string, unknown>;
            const out: Record<string, unknown> = {};

            for (const [key, val] of Object.entries(obj)) {
                const nextPath = currentPath ? `${currentPath}.${key}` : key;
                const normalizedKey = key.toLowerCase();
                const isSensitive = customKeys.some(
                    (sensitive) =>
                        normalizedKey === sensitive || normalizedKey.includes(sensitive)
                );

                if (isSensitive && (typeof val !== "object" || val === null)) {
                    maskedPaths.push(nextPath);
                    out[key] = maskPrimitiveValue(val);
                } else {
                    out[key] = traverse(val, nextPath);
                }
            }
            return out;
        }
        return node;
    }

    const maskedPayload = traverse(params.payload, "");

    return {
        maskedPayload,
        maskedFieldCount: maskedPaths.length,
        maskedPaths,
    };
}

