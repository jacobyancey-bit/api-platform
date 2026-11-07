import { describe, it, expect } from "vitest";
import { buildGatewayApp } from "./app.js";
import { DEFAULT_DEMO_RAW_KEY } from "@dangling-dice/db";

describe("Dangling Dice Studios API Gateway", () => {
    const app = buildGatewayApp();

    it("returns healthy status and OpenAPI 3.1 spec on public endpoints", async () => {
        const healthRes = await app.inject({ method: "GET", url: "/health" });
        expect(healthRes.statusCode).toBe(200);
        const body = healthRes.json();
        expect(body.status).toBe("healthy");
        expect(body.domain).toBe("https://dangling-dice-studios.com");

        const openApiRes = await app.inject({ method: "GET", url: "/v1/openapi.json" });
        expect(openApiRes.statusCode).toBe(200);
        expect(openApiRes.json().openapi).toBe("3.1.0");
    });

    it("blocks unauthenticated requests to /v1/* endpoints with 401 and helpful upgrade metadata", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/v1/finance/amortization",
            payload: { principal: 10000, annualRatePercent: 5, termMonths: 12 },
        });
        expect(res.statusCode).toBe(401);
        expect(res.json().error).toBe("Unauthorized");
        expect(res.json().enterprise.website).toBe("https://dangling-dice-studios.com");
    });

    it("executes all 4 engines over HTTP with valid Bearer API key and returns rate-limit headers", async () => {
        const headers = { authorization: `Bearer ${DEFAULT_DEMO_RAW_KEY}` };

        // 1. Finance
        const finRes = await app.inject({
            method: "POST",
            url: "/v1/finance/amortization",
            headers,
            payload: { principal: 12000, annualRatePercent: 6, termMonths: 12 },
        });
        expect(finRes.statusCode).toBe(200);
        expect(finRes.headers["x-ratelimit-remaining"]).toBeDefined();
        expect(finRes.json().data.monthlyPayment).toBe(1032.8);

        // 2. Schema
        const schemaRes = await app.inject({
            method: "POST",
            url: "/v1/schema/infer",
            headers,
            payload: {
                jsonInput: { userId: 42, email: "jacob@dangling-dice-studios.com" },
                rootName: "StudioUser",
            },
        });
        expect(schemaRes.statusCode).toBe(200);
        expect(schemaRes.json().data.zod).toContain("StudioUserSchema");

        // 3. Geo
        const geoRes = await app.inject({
            method: "POST",
            url: "/v1/geo/parcel-metrics",
            headers,
            payload: {
                coordinates: [
                    [-97.75, 30.25],
                    [-97.74, 30.25],
                    [-97.74, 30.26],
                    [-97.75, 30.26],
                ],
            },
        });
        expect(geoRes.statusCode).toBe(200);
        expect(geoRes.json().data.areaAcres).toBeGreaterThan(200);

        // 4. Privacy
        const privRes = await app.inject({
            method: "POST",
            url: "/v1/privacy/redact",
            headers,
            payload: {
                text: "Reach me at jacob@dangling-dice-studios.com or 123-45-6789",
                mode: "placeholder",
            },
        });
        expect(privRes.statusCode).toBe(200);
        expect(privRes.json().data.redactionCount).toBe(2);
    });

    it("supports self-serve key creation, Stripe webhook tier upgrade, and enterprise inquiry intake", async () => {
        const keyRes = await app.inject({
            method: "POST",
            url: "/v1/keys",
            payload: { email: "buyer@dangling-dice-studios.com", name: "SaaS Key" },
        });
        expect(keyRes.statusCode).toBe(201);
        expect(keyRes.json().record.tier).toBe("FREE");
        expect(keyRes.json().record.monthlyQuota).toBe(1000);

        const webhookRes = await app.inject({
            method: "POST",
            url: "/v1/billing/webhook",
            payload: {
                type: "checkout.session.completed",
                data: {
                    object: {
                        metadata: {
                            email: "buyer@dangling-dice-studios.com",
                            tier: "PRO",
                        },
                    },
                },
            },
        });
        expect(webhookRes.statusCode).toBe(200);
        expect(webhookRes.json().tier).toBe("PRO");

        const listRes = await app.inject({
            method: "GET",
            url: "/v1/keys?email=buyer@dangling-dice-studios.com",
        });
        expect(listRes.json().keys[0].tier).toBe("PRO");
        expect(listRes.json().keys[0].monthlyQuota).toBe(100000);

        const leadRes = await app.inject({
            method: "POST",
            url: "/v1/enterprise/inquiries",
            payload: {
                name: "Enterprise CTO",
                email: "cto@enterprise.io",
                budgetRange: "$5,000 - $10,000",
                projectDetails: "Deploy private VPC GIS & Schema engine cluster",
            },
        });
        expect(leadRes.statusCode).toBe(201);
    });
});

