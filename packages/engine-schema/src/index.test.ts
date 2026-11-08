import { describe, it, expect } from "vitest";
import { inferFromJson, sqlToTypeScript, inspectDatabaseUri } from "./index.js";

describe("inferFromJson", () => {
    it("infers TypeScript, Zod, JSON Schema, and SQL DDL from a sample JSON object", () => {
        const sample = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            email: "studio@dangling-dice-studios.com",
            credits: 1000,
            isActive: true,
            createdAt: "2026-11-07T17:00:00Z",
        };

        const result = inferFromJson({
            jsonInput: JSON.stringify(sample),
            rootName: "DeveloperAccount",
        });

        expect(result.rootName).toBe("DeveloperAccount");
        expect(result.typescript).toContain("export interface DeveloperAccount");
        expect(result.typescript).toContain("credits: number;");
        expect(result.zod).toContain("z.string().uuid()");
        expect(result.zod).toContain("z.string().email()");
        expect(result.zod).toContain("z.number().int()");
        expect(result.sqlDdl).toContain("CREATE TABLE developer_account");
        expect(result.sqlDdl).toContain("id UUID PRIMARY KEY");
        expect(result.jsonSchema).toHaveProperty("title", "DeveloperAccount");
    });

    it("throws a clear error on malformed JSON strings", () => {
        expect(() => inferFromJson({ jsonInput: "{ bad json" })).toThrow("Invalid JSON input");
    });
});

describe("sqlToTypeScript", () => {
    it("converts a SQL CREATE TABLE statement into TypeScript and Zod schemas", () => {
        const sql = `
            CREATE TABLE api_keys (
                id UUID PRIMARY KEY,
                user_id INTEGER NOT NULL,
                key_prefix VARCHAR(32) NOT NULL,
                is_active BOOLEAN NOT NULL,
                metadata JSONB
            );
        `;

        const result = sqlToTypeScript({ sqlDdl: sql });

        expect(result.interfaceName).toBe("ApiKeys");
        expect(result.columns).toHaveLength(5);
        expect(result.typescript).toContain("id: string;");
        expect(result.typescript).toContain("user_id: number;");
        expect(result.typescript).toContain("metadata: Record<string, unknown> | null;");
        expect(result.zod).toContain("z.string().uuid()");
        expect(result.zod).toContain("z.boolean()");
    });
});

describe("inspectDatabaseUri (Database Connection Inspector)", () => {
    it("percent-encodes special password characters and generates .env snippet", () => {
        const res = inspectDatabaseUri({
            uri: "mongodb+srv://studioAdmin:MyP@ss:w0rd#2026@cluster0.danglingdice.mongodb.net/production_db?retryWrites=true",
        });

        expect(res.isValid).toBe(true);
        expect(res.engine).toBe("mongodb");
        expect(res.encodedSafeUri).toContain("MyP%40ss%3Aw0rd%232026");
        expect(res.warnings.length).toBeGreaterThan(0);
    });
});

