import { describe, it, expect } from "vitest";
import { validateLuhn, redactText, maskJsonPayload } from "./index.js";

describe("validateLuhn", () => {
    it("validates a known valid Visa number and detects network", () => {
        const res = validateLuhn("4532 0151 1283 0366");
        expect(res.isValid).toBe(true);
        expect(res.network).toBe("visa");
        expect(res.maskedNumber).toBe("************0366");
    });

    it("rejects an invalid credit card number", () => {
        const res = validateLuhn("4532 0151 1283 0367");
        expect(res.isValid).toBe(false);
        expect(res.network).toBe("unknown");
    });
});

describe("redactText", () => {
    it("redacts emails, SSNs, Luhn-valid cards, phones, IPs, and API keys", () => {
        const sample =
            "User studio@dangling-dice-studios.com called from (512) 555-0199 with SSN 123-45-6789, card 4532-0151-1283-0366, IP 192.168.1.42 and token ap_live_9876543210abcdef.";

        const result = redactText({ text: sample, mode: "placeholder" });

        expect(result.redactionCount).toBe(6);
        expect(result.countsByCategory.email).toBe(1);
        expect(result.countsByCategory.phone).toBe(1);
        expect(result.countsByCategory.ssn).toBe(1);
        expect(result.countsByCategory.credit_card).toBe(1);
        expect(result.countsByCategory.ipv4).toBe(1);
        expect(result.countsByCategory.api_key).toBe(1);
        expect(result.sanitizedText).not.toContain("123-45-6789");
        expect(result.sanitizedText).not.toContain("4532-0151-1283-0366");
    });

    it("supports partial mask mode", () => {
        const result = redactText({
            text: "Contact jacob@dangling-dice-studios.com",
            mode: "mask",
        });
        expect(result.sanitizedText).toBe("Contact j***@dangling-dice-studios.com");
    });
});

describe("maskJsonPayload", () => {
    it("recursively masks sensitive keys in nested JSON payloads", () => {
        const payload = {
            username: "jacobyancey",
            password: "SuperSecretPassword123",
            auth: {
                api_key: "ap_live_1234567890abcdef",
                role: "admin",
            },
        };

        const result = maskJsonPayload({ payload });

        expect(result.maskedFieldCount).toBe(2);
        expect(result.maskedPaths).toEqual(["password", "auth.api_key"]);
        const masked = result.maskedPayload as Record<string, any>;
        expect(masked.username).toBe("jacobyancey");
        expect(masked.password).not.toBe("SuperSecretPassword123");
        expect(masked.auth.role).toBe("admin");
    });
});
