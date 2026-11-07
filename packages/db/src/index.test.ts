import { describe, it, expect } from "vitest";
import {
    platformStore,
    DEFAULT_DEMO_RAW_KEY,
    generateRawApiKey,
    hashApiKey,
} from "./index.js";

describe("@dangling-dice/db store & API key utilities", () => {
    it("verifies the seeded Dangling Dice Studio demo key", () => {
        const verified = platformStore.verifyApiKey(DEFAULT_DEMO_RAW_KEY);
        expect(verified).not.toBeNull();
        expect(verified?.tier).toBe("PRO");
        expect(verified?.email).toBe("studio@dangling-dice-studios.com");
    });

    it("generates, verifies, meters, and revokes a new self-serve API key", () => {
        const { rawKey, record } = platformStore.createApiKey({
            email: "dev@example.com",
            name: "Production Key",
            tier: "FREE",
        });

        expect(rawKey).toMatch(/^dds_live_/);
        expect(hashApiKey(rawKey)).toBe(record.keyHash);

        const verified = platformStore.verifyApiKey(rawKey);
        expect(verified?.id).toBe(record.id);
        expect(verified?.monthlyQuota).toBe(1000);

        platformStore.recordUsage({
            apiKeyId: record.id,
            userId: record.userId,
            engine: "schema",
            endpoint: "/v1/schema/infer",
            statusCode: 200,
            latencyMs: 2.4,
        });

        expect(platformStore.verifyApiKey(rawKey)?.currentMonthUsage).toBe(1);

        platformStore.revokeApiKey(record.id);
        expect(platformStore.verifyApiKey(rawKey)).toBeNull();
    });
});
