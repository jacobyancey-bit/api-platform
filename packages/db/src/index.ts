import crypto from "node:crypto";

export type PlanTier = "FREE" | "PRO" | "SCALE" | "ENTERPRISE";

export interface TierConfig {
    id: PlanTier;
    name: string;
    priceMonthlyUsd: number;
    monthlyQuota: number;
    rateLimitPerMinute: number;
    description: string;
}

export const PLAN_TIERS: Record<PlanTier, TierConfig> = {
    FREE: {
        id: "FREE",
        name: "Developer Free",
        priceMonthlyUsd: 0,
        monthlyQuota: 1_000,
        rateLimitPerMinute: 60,
        description: "1,000 API calls/month, 60 req/min. Ideal for prototyping and side projects.",
    },
    PRO: {
        id: "PRO",
        name: "Pro API",
        priceMonthlyUsd: 29,
        monthlyQuota: 100_000,
        rateLimitPerMinute: 300,
        description: "100,000 API calls/month, 300 req/min. Built for production SaaS & workflows.",
    },
    SCALE: {
        id: "SCALE",
        name: "Scale API",
        priceMonthlyUsd: 99,
        monthlyQuota: 500_000,
        rateLimitPerMinute: 1_000,
        description: "500,000 API calls/month, 1,000 req/min + priority support.",
    },
    ENTERPRISE: {
        id: "ENTERPRISE",
        name: "Custom Architecture & VPC",
        priceMonthlyUsd: 2500,
        monthlyQuota: 10_000_000,
        rateLimitPerMinute: 10_000,
        description:
            "Private AWS/GCP VPC deployment, dedicated SLAs, and custom engine engineering ($2k - $10k+).",
    },
};

export interface ApiKeyRecord {
    id: string;
    userId: string;
    email: string;
    name: string;
    keyPrefix: string;
    keyHash: string;
    tier: PlanTier;
    rateLimitPerMinute: number;
    monthlyQuota: number;
    currentMonthUsage: number;
    isActive: boolean;
    createdAt: string;
    lastUsedAt: string | null;
}

export interface UsageLogRecord {
    id: string;
    apiKeyId: string;
    userId: string;
    engine: "finance" | "schema" | "geo" | "privacy";
    endpoint: string;
    statusCode: number;
    latencyMs: number;
    createdAt: string;
}

export interface ConsultingInquiryRecord {
    id: string;
    name: string;
    email: string;
    company?: string;
    budgetRange: string;
    engineInterest: string;
    projectDetails: string;
    createdAt: string;
}

export function hashApiKey(rawKey: string): string {
    return crypto.createHash("sha256").update(rawKey.trim()).digest("hex");
}

export function generateRawApiKey(env: "live" | "test" = "live"): {
    rawKey: string;
    keyPrefix: string;
    keyHash: string;
} {
    const randomHex = crypto.randomBytes(20).toString("hex");
    const rawKey = `dds_${env}_${randomHex}`;
    const keyPrefix = `${rawKey.slice(0, 13)}...${rawKey.slice(-4)}`;
    const keyHash = hashApiKey(rawKey);
    return { rawKey, keyPrefix, keyHash };
}

/**
 * Default Demo / Studio Developer Key so Dangling Dice Studios sandboxes,
 * Postman collections, and local tests work out-of-the-box without Docker setup.
 */
export const DEFAULT_DEMO_RAW_KEY = "dds_live_dangling_dice_demo_key_2026";

class PlatformStore {
    private keysByHash = new Map<string, ApiKeyRecord>();
    private keysById = new Map<string, ApiKeyRecord>();
    private usageLogs: UsageLogRecord[] = [];
    private inquiries: ConsultingInquiryRecord[] = [];

    constructor() {
        this.seedDefaultStudioKeys();
    }

    private seedDefaultStudioKeys(): void {
        const demoHash = hashApiKey(DEFAULT_DEMO_RAW_KEY);
        const demoRecord: ApiKeyRecord = {
            id: "key_studio_demo_01",
            userId: "user_studio_founder",
            email: "studio@dangling-dice-studios.com",
            name: "Dangling Dice Studio Default Key",
            keyPrefix: "dds_live_dang...2026",
            keyHash: demoHash,
            tier: "PRO",
            rateLimitPerMinute: PLAN_TIERS.PRO.rateLimitPerMinute,
            monthlyQuota: PLAN_TIERS.PRO.monthlyQuota,
            currentMonthUsage: 142,
            isActive: true,
            createdAt: new Date().toISOString(),
            lastUsedAt: new Date().toISOString(),
        };

        this.keysByHash.set(demoHash, demoRecord);
        this.keysById.set(demoRecord.id, demoRecord);
    }

    public createApiKey(params: {
        email: string;
        name: string;
        tier?: PlanTier;
    }): { rawKey: string; record: ApiKeyRecord } {
        const tier = params.tier || "FREE";
        const tierSpec = PLAN_TIERS[tier];
        const { rawKey, keyPrefix, keyHash } = generateRawApiKey("live");

        const record: ApiKeyRecord = {
            id: `key_${crypto.randomBytes(6).toString("hex")}`,
            userId: `usr_${crypto.randomBytes(6).toString("hex")}`,
            email: params.email.toLowerCase().trim(),
            name: params.name.trim() || "Default API Key",
            keyPrefix,
            keyHash,
            tier,
            rateLimitPerMinute: tierSpec.rateLimitPerMinute,
            monthlyQuota: tierSpec.monthlyQuota,
            currentMonthUsage: 0,
            isActive: true,
            createdAt: new Date().toISOString(),
            lastUsedAt: null,
        };

        this.keysByHash.set(keyHash, record);
        this.keysById.set(record.id, record);
        return { rawKey, record };
    }

    public verifyApiKey(rawKey: string): ApiKeyRecord | null {
        if (!rawKey) return null;
        const hash = hashApiKey(rawKey);
        const record = this.keysByHash.get(hash);
        if (!record || !record.isActive) return null;
        return record;
    }

    public listApiKeys(email?: string): ApiKeyRecord[] {
        const all = Array.from(this.keysById.values());
        if (!email) return all;
        return all.filter((k) => k.email === email.toLowerCase().trim());
    }

    public revokeApiKey(id: string): boolean {
        const record = this.keysById.get(id);
        if (!record) return false;
        record.isActive = false;
        return true;
    }

    public upgradeTierByEmail(
        email: string,
        tier: PlanTier
    ): ApiKeyRecord[] {
        const normalized = email.toLowerCase().trim();
        const tierSpec = PLAN_TIERS[tier];
        const updated: ApiKeyRecord[] = [];

        for (const record of this.keysById.values()) {
            if (record.email === normalized && record.isActive) {
                record.tier = tier;
                record.rateLimitPerMinute = tierSpec.rateLimitPerMinute;
                record.monthlyQuota = tierSpec.monthlyQuota;
                updated.push(record);
            }
        }

        if (updated.length === 0) {
            const created = this.createApiKey({
                email: normalized,
                name: `${tierSpec.name} Key`,
                tier,
            });
            updated.push(created.record);
        }

        return updated;
    }

    public recordUsage(params: {
        apiKeyId: string;
        userId: string;
        engine: "finance" | "schema" | "geo" | "privacy";
        endpoint: string;
        statusCode: number;
        latencyMs: number;
    }): UsageLogRecord {
        const keyRecord = this.keysById.get(params.apiKeyId);
        if (keyRecord) {
            keyRecord.currentMonthUsage += 1;
            keyRecord.lastUsedAt = new Date().toISOString();
        }

        const log: UsageLogRecord = {
            id: `log_${crypto.randomBytes(6).toString("hex")}`,
            apiKeyId: params.apiKeyId,
            userId: params.userId,
            engine: params.engine,
            endpoint: params.endpoint,
            statusCode: params.statusCode,
            latencyMs: params.latencyMs,
            createdAt: new Date().toISOString(),
        };

        this.usageLogs.unshift(log);
        if (this.usageLogs.length > 500) {
            this.usageLogs.pop();
        }
        return log;
    }

    public getRecentUsageLogs(limit = 50): UsageLogRecord[] {
        return this.usageLogs.slice(0, limit);
    }

    public createConsultingInquiry(
        params: Omit<ConsultingInquiryRecord, "id" | "createdAt">
    ): ConsultingInquiryRecord {
        const inquiry: ConsultingInquiryRecord = {
            ...params,
            id: `inq_${crypto.randomBytes(6).toString("hex")}`,
            createdAt: new Date().toISOString(),
        };
        this.inquiries.unshift(inquiry);
        return inquiry;
    }

    public listConsultingInquiries(): ConsultingInquiryRecord[] {
        return [...this.inquiries];
    }
}

export const platformStore = new PlatformStore();

