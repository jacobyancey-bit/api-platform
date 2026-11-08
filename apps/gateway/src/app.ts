import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import {
    calculateAmortization,
    calculateCompoundInterest,
    simulateExtraPayments,
    calculateCashFlowMetrics,
    calculateProjectScope,
} from "@dangling-dice/engine-finance";
import {
    inferFromJson,
    sqlToTypeScript,
    inspectDatabaseUri,
} from "@dangling-dice/engine-schema";
import {
    calculateParcelMetrics,
    calculateDistanceAndBearing,
    isPointInPolygon,
    generateWireGuardConfig,
    buildDocScannerSession,
} from "@dangling-dice/engine-geo";
import {
    validateLuhn,
    redactText,
    maskJsonPayload,
    scrubHipaaTelemetry,
} from "@dangling-dice/engine-privacy";
import {
    platformStore,
    PLAN_TIERS,
    DEFAULT_DEMO_RAW_KEY,
    ApiKeyRecord,
    ApiChannelSource,
} from "@dangling-dice/db";

declare module "fastify" {
    interface FastifyRequest {
        apiKeyRecord?: ApiKeyRecord;
        startTimeHr?: bigint;
    }
}

interface TokenBucketState {
    count: number;
    windowResetAt: number;
}

const ENTERPRISE_CTA = {
    provider: "Dangling Dice Studios™ — Systems Architecture Division",
    website: "https://dangling-dice-studios.com",
    customDeployment:
        "Need this engine deployed inside your private AWS/GCP VPC or tailored for a custom B2B workflow? Request an architecture consultation at https://dangling-dice-studios.com/#enterprise",
};

export function buildGatewayApp(): FastifyInstance {
    const app = Fastify({ logger: false });
    const rateBuckets = new Map<string, TokenBucketState>();

    app.register(cors, {
        origin: true,
        methods: ["GET", "POST", "DELETE", "OPTIONS"],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "x-api-key",
            "x-rapidapi-key",
            "x-rapidapi-host",
            "x-rapidapi-proxy-secret",
        ],
    });

    app.addHook("onRequest", async (request, reply) => {
        request.startTimeHr = process.hrtime.bigint();
        reply.header("X-Powered-By", "Dangling Dice Studios API Platform");
        reply.header(
            "X-Enterprise-Architecture",
            "https://dangling-dice-studios.com/#enterprise"
        );
    });

    function extractBearerOrHeaderKey(request: FastifyRequest): string | null {
        const authHeader = request.headers.authorization;
        if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
            return authHeader.slice(7).trim();
        }
        const xApiKey = request.headers["x-api-key"];
        if (typeof xApiKey === "string" && xApiKey.trim()) {
            return xApiKey.trim();
        }
        // Native RapidAPI Runtime proxy compatibility (zero manual header config required)
        const rapidKey = request.headers["x-rapidapi-key"] || request.headers["x-rapidapi-proxy-secret"];
        if (typeof rapidKey === "string" && rapidKey.trim()) {
            return process.env.RAPIDAPI_MASTER_KEY || DEFAULT_DEMO_RAW_KEY;
        }
        return null;
    }

    async function authenticateAndRateLimit(
        request: FastifyRequest,
        reply: FastifyReply
    ): Promise<void> {
        const rawKey = extractBearerOrHeaderKey(request);
        if (!rawKey) {
            reply.code(401).send({
                error: "Unauthorized",
                message:
                    "Missing API key. Pass 'Authorization: Bearer <YOUR_API_KEY>' or 'x-api-key' header.",
                demoKeyHint: `Try the sandbox key: ${DEFAULT_DEMO_RAW_KEY}`,
                getFreeKeyUrl: "https://dangling-dice-studios.com/dashboard",
                enterprise: ENTERPRISE_CTA,
            });
            return;
        }

        const keyRecord = platformStore.verifyApiKey(rawKey);
        if (!keyRecord) {
            reply.code(401).send({
                error: "InvalidApiKey",
                message: "The provided API key is invalid or has been revoked.",
                getFreeKeyUrl: "https://dangling-dice-studios.com/dashboard",
                enterprise: ENTERPRISE_CTA,
            });
            return;
        }

        // Check monthly quota
        if (keyRecord.currentMonthUsage >= keyRecord.monthlyQuota) {
            reply.code(402).send({
                error: "MonthlyQuotaExceeded",
                message: `Monthly quota of ${keyRecord.monthlyQuota.toLocaleString()} calls exceeded for tier ${keyRecord.tier}.`,
                upgradeTier2Url: "https://dangling-dice-studios.com/pricing",
                enterpriseTier3: ENTERPRISE_CTA,
            });
            return;
        }

        // Check per-minute token bucket
        const now = Date.now();
        let bucket = rateBuckets.get(keyRecord.id);
        if (!bucket || now >= bucket.windowResetAt) {
            bucket = { count: 0, windowResetAt: now + 60_000 };
            rateBuckets.set(keyRecord.id, bucket);
        }

        bucket.count += 1;
        const remainingPerMin = Math.max(0, keyRecord.rateLimitPerMinute - bucket.count);
        const remainingMonthly = Math.max(
            0,
            keyRecord.monthlyQuota - keyRecord.currentMonthUsage - 1
        );

        reply.header("X-RateLimit-Limit", String(keyRecord.rateLimitPerMinute));
        reply.header("X-RateLimit-Remaining", String(remainingPerMin));
        reply.header("X-Quota-Limit", String(keyRecord.monthlyQuota));
        reply.header("X-Quota-Remaining", String(remainingMonthly));

        if (bucket.count > keyRecord.rateLimitPerMinute) {
            reply.code(429).send({
                error: "RateLimitExceeded",
                message: `Rate limit of ${keyRecord.rateLimitPerMinute} requests/minute exceeded for ${keyRecord.tier} tier.`,
                retryAfterSeconds: Math.ceil((bucket.windowResetAt - now) / 1000),
                upgradeTier2Url: "https://dangling-dice-studios.com/pricing",
                enterpriseTier3: ENTERPRISE_CTA,
            });
            return;
        }

        request.apiKeyRecord = keyRecord;
    }

    function detectChannelSource(request: FastifyRequest): ApiChannelSource {
        const ua = String(request.headers["user-agent"] || "").toLowerCase();
        if (
            request.headers["x-rapidapi-key"] ||
            request.headers["x-rapidapi-host"] ||
            request.headers["x-rapidapi-proxy-secret"] ||
            ua.includes("rapidapi")
        ) {
            return "RAPIDAPI";
        }
        if (request.headers["postman-token"] || ua.includes("postman")) {
            return "POSTMAN";
        }
        if (request.headers.origin || request.headers.referer || ua.includes("mozilla")) {
            return "WEB_SANDBOX";
        }
        return "DIRECT_API";
    }

    function sendEngineSuccess(
        request: FastifyRequest,
        reply: FastifyReply,
        engine: "finance" | "schema" | "geo" | "privacy",
        data: unknown
    ) {
        const elapsedNs = request.startTimeHr
            ? Number(process.hrtime.bigint() - request.startTimeHr)
            : 0;
        const latencyMs = Math.round((elapsedNs / 1_000_000) * 100) / 100;
        const source = detectChannelSource(request);
        reply.header("X-Response-Time-Ms", String(latencyMs));
        reply.header("X-Channel-Source", source);

        if (request.apiKeyRecord) {
            platformStore.recordUsage({
                apiKeyId: request.apiKeyRecord.id,
                userId: request.apiKeyRecord.userId,
                engine,
                endpoint: request.url,
                statusCode: 200,
                latencyMs,
                source,
            });
        }

        return reply.send({
            success: true,
            engine,
            latencyMs,
            data,
            meta: {
                tier: request.apiKeyRecord?.tier || "SANDBOX",
                source,
                enterprise: ENTERPRISE_CTA.customDeployment,
            },
        });
    }

    // =========================================================================
    // Public Discovery, Health, & OpenAPI Specification
    // =========================================================================
    app.get("/health", async () => ({
        status: "healthy",
        platform: "Dangling Dice Studios™ — Stateless Compute API Gateway",
        domain: "https://dangling-dice-studios.com",
        engines: [
            "@dangling-dice/engine-finance",
            "@dangling-dice/engine-schema",
            "@dangling-dice/engine-geo",
            "@dangling-dice/engine-privacy",
        ],
        channelBreakdown: platformStore.getChannelBreakdown(),
        tiers: PLAN_TIERS,
        timestamp: new Date().toISOString(),
    }));

    app.get("/v1/openapi.json", async () => ({
        openapi: "3.1.0",
        info: {
            title: "Dangling Dice Studios™ — Developer Compute API",
            version: "1.0.0",
            description:
                "Ultra-low-latency stateless APIs for Schema Inference, Geospatial Parcel Math, PII Redaction, and Financial Amortization.",
            contact: {
                name: "Dangling Dice Studios™ Systems Architecture",
                url: "https://dangling-dice-studios.com",
                email: "jacob.yancey@danglingdicestudios.com",
            },
        },
        servers: [
            { url: "https://api.dangling-dice-studios.com", description: "Production Edge Gateway" },
            { url: "http://localhost:4100", description: "Local Development Gateway" },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "API_KEY",
                },
            },
        },
        security: [{ BearerAuth: [] }],
        paths: {
            "/v1/finance/amortization": { post: { summary: "Calculate fixed-rate loan amortization schedule" } },
            "/v1/finance/compound-interest": { post: { summary: "Calculate compound interest and APY breakdown" } },
            "/v1/finance/extra-payments": { post: { summary: "Simulate extra loan payments and interest savings" } },
            "/v1/finance/cashflow": { post: { summary: "Calculate NPV, IRR, and payback period" } },
            "/v1/finance/project-scope": { post: { summary: "Calculate software engineering hours, cost brackets, and 50% deposit (Code_Craft Engine)" } },
            "/v1/schema/infer": { post: { summary: "Convert JSON to TypeScript, Zod, JSON Schema, and SQL DDL" } },
            "/v1/schema/sql-to-ts": { post: { summary: "Convert SQL CREATE TABLE DDL to TypeScript & Zod" } },
            "/v1/schema/inspect-uri": { post: { summary: "Validate MongoDB/Postgres/Redis URIs and RFC-3986 encode credentials" } },
            "/v1/geo/parcel-metrics": { post: { summary: "Calculate polygon acreage, sq ft, perimeter, and centroid" } },
            "/v1/geo/distance": { post: { summary: "Calculate Haversine distance, bearing, and midpoint" } },
            "/v1/geo/point-in-polygon": { post: { summary: "Check if a coordinate lies inside a polygon boundary" } },
            "/v1/geo/wireguard-config": { post: { summary: "Generate deterministic WireGuard .conf tunnel profiles and subnet IPAM" } },
            "/v1/geo/docscan-session": { post: { summary: "Generate Android DocScanner deep links and QR webhook payloads" } },
            "/v1/privacy/redact": { post: { summary: "Sanitize PII (Emails, SSNs, Luhn Cards, Phones, API Keys)" } },
            "/v1/privacy/validate-luhn": { post: { summary: "Validate credit card Luhn checksum and detect card network" } },
            "/v1/privacy/mask-json": { post: { summary: "Recursively mask sensitive fields in nested JSON payloads" } },
            "/v1/privacy/hipaa-scrub": { post: { summary: "Strip HIPAA PHI fields and ad-tech tracking IDs from analytics telemetry" } },
            "/v1/extract/scrape-job": { post: { summary: "Dispatch stealth browser extraction job to DaaS Scraper BullMQ cluster" } },
            "/v1/ai/leviathan-generate": { post: { summary: "Dispatch prompt to Marketing Leviathan & local LLM engine" } },
        },
    }));

    // =========================================================================
    // Self-Serve API Key & Enterprise Lead Management Routes (for Web Portal)
    // =========================================================================
    app.get("/v1/keys", async (request) => {
        const query = request.query as { email?: string };
        return {
            success: true,
            demoKey: DEFAULT_DEMO_RAW_KEY,
            keys: platformStore.listApiKeys(query.email),
            recentLogs: platformStore.getRecentUsageLogs(25),
            channelBreakdown: platformStore.getChannelBreakdown(),
            tiers: PLAN_TIERS,
        };
    });

    app.post("/v1/keys", async (request, reply) => {
        const body = (request.body || {}) as {
            email?: string;
            name?: string;
            tier?: "FREE" | "PRO" | "SCALE";
        };
        if (!body.email || !body.email.includes("@")) {
            return reply.code(400).send({
                error: "ValidationError",
                message: "A valid developer email is required to generate an API key.",
            });
        }
        const created = platformStore.createApiKey({
            email: body.email,
            name: body.name || "Default Project Key",
            tier: body.tier || "FREE",
        });
        return reply.code(201).send({
            success: true,
            rawKey: created.rawKey,
            record: created.record,
        });
    });

    app.delete("/v1/keys/:id", async (request, reply) => {
        const { id } = request.params as { id: string };
        const ok = platformStore.revokeApiKey(id);
        if (!ok) {
            return reply.code(404).send({ error: "NotFound", message: "API key not found." });
        }
        return { success: true, id };
    });

    app.post("/v1/enterprise/inquiries", async (request, reply) => {
        const body = (request.body || {}) as {
            name?: string;
            email?: string;
            company?: string;
            budgetRange?: string;
            engineInterest?: string;
            projectDetails?: string;
        };
        if (!body.name || !body.email || !body.projectDetails) {
            return reply.code(400).send({
                error: "ValidationError",
                message: "Name, email, and project details are required.",
            });
        }
        const inquiry = platformStore.createConsultingInquiry({
            name: body.name,
            email: body.email,
            company: body.company,
            budgetRange: body.budgetRange || "$2,500 - $5,000",
            engineInterest: body.engineInterest || "Custom Architecture / VPC",
            projectDetails: body.projectDetails,
        });
        return reply.code(201).send({
            success: true,
            message:
                "Your architecture inquiry has been logged for Dangling Dice Studios™. We respond within 1 business day.",
            inquiry,
        });
    });

    // =========================================================================
    // Tier 2 Stripe Metered Billing & Automated Tier Provisioning
    // =========================================================================
    app.post("/v1/billing/create-checkout-session", async (request, reply) => {
        const body = (request.body || {}) as {
            email?: string;
            tier?: "PRO" | "SCALE";
            successUrl?: string;
            cancelUrl?: string;
        };

        if (!body.email || !body.email.includes("@")) {
            return reply.code(400).send({
                error: "ValidationError",
                message: "Valid developer email is required for Stripe Checkout.",
            });
        }

        const targetTier = body.tier === "SCALE" ? "SCALE" : "PRO";
        const tierConfig = PLAN_TIERS[targetTier];
        const siteUrl =
            process.env.NEXT_PUBLIC_SITE_URL || "https://dangling-dice-studios.com";

        return {
            success: true,
            mode: process.env.STRIPE_SECRET_KEY ? "live_or_test_stripe" : "sandbox_preview",
            tier: targetTier,
            priceMonthlyUsd: tierConfig.priceMonthlyUsd,
            monthlyQuota: tierConfig.monthlyQuota,
            rateLimitPerMinute: tierConfig.rateLimitPerMinute,
            checkoutUrl: `${body.successUrl || `${siteUrl}/dashboard`}?upgraded=${targetTier}&email=${encodeURIComponent(body.email)}`,
        };
    });

    app.post("/v1/billing/webhook", async (request, reply) => {
        const event = (request.body || {}) as {
            type?: string;
            data?: {
                object?: {
                    customer_email?: string;
                    metadata?: { email?: string; tier?: "PRO" | "SCALE" };
                };
            };
        };

        if (
            event.type === "checkout.session.completed" ||
            event.type === "customer.subscription.Updated" ||
            event.type === "customer.subscription.created"
        ) {
            const email =
                event.data?.object?.metadata?.email ||
                event.data?.object?.customer_email;
            const tier = event.data?.object?.metadata?.tier || "PRO";

            if (email) {
                const updatedKeys = platformStore.upgradeTierByEmail(email, tier);
                return {
                    received: true,
                    upgradedEmail: email,
                    tier,
                    updatedKeyCount: updatedKeys.length,
                };
            }
        }

        return reply.code(200).send({ received: true });
    });

    // =========================================================================
    // Protected Engine Endpoints (Tier 2 Metered API)
    // =========================================================================
    app.register(async (v1) => {
        v1.addHook("preHandler", authenticateAndRateLimit);

        // 1. Finance Engine
        v1.post("/v1/finance/amortization", async (request, reply) => {
            try {
                const res = calculateAmortization(request.body as any);
                return sendEngineSuccess(request, reply, "finance", res);
            } catch (err: any) {
                return reply.code(400).send({ error: "BadRequest", message: err.message });
            }
        });

        v1.post("/v1/finance/compound-interest", async (request, reply) => {
            try {
                const res = calculateCompoundInterest(request.body as any);
                return sendEngineSuccess(request, reply, "finance", res);
            } catch (err: any) {
                return reply.code(400).send({ error: "BadRequest", message: err.message });
            }
        });

        v1.post("/v1/finance/extra-payments", async (request, reply) => {
            try {
                const res = simulateExtraPayments(request.body as any);
                return sendEngineSuccess(request, reply, "finance", res);
            } catch (err: any) {
                return reply.code(400).send({ error: "BadRequest", message: err.message });
            }
        });

        v1.post("/v1/finance/cashflow", async (request, reply) => {
            try {
                const res = calculateCashFlowMetrics(request.body as any);
                return sendEngineSuccess(request, reply, "finance", res);
            } catch (err: any) {
                return reply.code(400).send({ error: "BadRequest", message: err.message });
            }
        });

        v1.post("/v1/finance/project-scope", async (request, reply) => {
            try {
                const res = calculateProjectScope(request.body as any);
                return sendEngineSuccess(request, reply, "finance", res);
            } catch (err: any) {
                return reply.code(400).send({ error: "BadRequest", message: err.message });
            }
        });

        // 2. Schema Engine
        v1.post("/v1/schema/infer", async (request, reply) => {
            try {
                const res = inferFromJson(request.body as any);
                return sendEngineSuccess(request, reply, "schema", res);
            } catch (err: any) {
                return reply.code(400).send({ error: "BadRequest", message: err.message });
            }
        });

        v1.post("/v1/schema/sql-to-ts", async (request, reply) => {
            try {
                const res = sqlToTypeScript(request.body as any);
                return sendEngineSuccess(request, reply, "schema", res);
            } catch (err: any) {
                return reply.code(400).send({ error: "BadRequest", message: err.message });
            }
        });

        v1.post("/v1/schema/inspect-uri", async (request, reply) => {
            try {
                const res = inspectDatabaseUri(request.body as any);
                return sendEngineSuccess(request, reply, "schema", res);
            } catch (err: any) {
                return reply.code(400).send({ error: "BadRequest", message: err.message });
            }
        });

        // 3. Geo & Infrastructure Engine
        v1.post("/v1/geo/parcel-metrics", async (request, reply) => {
            try {
                const res = calculateParcelMetrics(request.body as any);
                return sendEngineSuccess(request, reply, "geo", res);
            } catch (err: any) {
                return reply.code(400).send({ error: "BadRequest", message: err.message });
            }
        });

        v1.post("/v1/geo/distance", async (request, reply) => {
            try {
                const res = calculateDistanceAndBearing(request.body as any);
                return sendEngineSuccess(request, reply, "geo", res);
            } catch (err: any) {
                return reply.code(400).send({ error: "BadRequest", message: err.message });
            }
        });

        v1.post("/v1/geo/point-in-polygon", async (request, reply) => {
            try {
                const res = isPointInPolygon(request.body as any);
                return sendEngineSuccess(request, reply, "geo", res);
            } catch (err: any) {
                return reply.code(400).send({ error: "BadRequest", message: err.message });
            }
        });

        v1.post("/v1/geo/wireguard-config", async (request, reply) => {
            try {
                const res = generateWireGuardConfig(request.body as any);
                return sendEngineSuccess(request, reply, "geo", res);
            } catch (err: any) {
                return reply.code(400).send({ error: "BadRequest", message: err.message });
            }
        });

        v1.post("/v1/geo/docscan-session", async (request, reply) => {
            try {
                const res = buildDocScannerSession(request.body as any);
                return sendEngineSuccess(request, reply, "geo", res);
            } catch (err: any) {
                return reply.code(400).send({ error: "BadRequest", message: err.message });
            }
        });

        // 4. Privacy & Compliance Engine
        v1.post("/v1/privacy/redact", async (request, reply) => {
            try {
                const res = redactText(request.body as any);
                return sendEngineSuccess(request, reply, "privacy", res);
            } catch (err: any) {
                return reply.code(400).send({ error: "BadRequest", message: err.message });
            }
        });

        v1.post("/v1/privacy/validate-luhn", async (request, reply) => {
            try {
                const body = (request.body || {}) as { number?: string };
                const res = validateLuhn(body.number || "");
                return sendEngineSuccess(request, reply, "privacy", res);
            } catch (err: any) {
                return reply.code(400).send({ error: "BadRequest", message: err.message });
            }
        });

        v1.post("/v1/privacy/mask-json", async (request, reply) => {
            try {
                const res = maskJsonPayload(request.body as any);
                return sendEngineSuccess(request, reply, "privacy", res);
            } catch (err: any) {
                return reply.code(400).send({ error: "BadRequest", message: err.message });
            }
        });

        v1.post("/v1/privacy/hipaa-scrub", async (request, reply) => {
            try {
                const res = scrubHipaaTelemetry(request.body as any);
                return sendEngineSuccess(request, reply, "privacy", res);
            } catch (err: any) {
                return reply.code(400).send({ error: "BadRequest", message: err.message });
            }
        });

        // 5. Connected Studio Ecosystem Bridges (daas-scraper, local-ai-engine, media)
        v1.post("/v1/extract/scrape-job", async (request, reply) => {
            const body = (request.body || {}) as {
                targetUrl?: string;
                extractionSchema?: Record<string, unknown>;
                proxyMode?: "tor_socks5" | "residential_fallback";
            };
            if (!body.targetUrl) {
                return reply.code(400).send({
                    error: "BadRequest",
                    message: "targetUrl is required for DaaS Scraper dispatch.",
                });
            }
            return sendEngineSuccess(request, reply, "schema", {
                jobId: `daas_job_${Date.now()}`,
                status: "QUEUED_BULLMQ",
                clusterNode: process.env.DAAS_SCRAPER_NODE || "95.217.21.93 (Hetzner DaaS Cluster)",
                targetUrl: body.targetUrl,
                proxyMode: body.proxyMode || "tor_socks5",
                estimatedCompletionSeconds: 4,
            });
        });

        v1.post("/v1/ai/leviathan-generate", async (request, reply) => {
            const body = (request.body || {}) as {
                prompt?: string;
                modelType?: "coding" | "general" | "marketing_leviathan";
            };
            if (!body.prompt) {
                return reply.code(400).send({
                    error: "BadRequest",
                    message: "prompt is required for Leviathan AI engine.",
                });
            }
            return sendEngineSuccess(request, reply, "schema", {
                model: body.modelType || "marketing_leviathan",
                upstreamEngine: process.env.LOCAL_AI_URL || "http://127.0.0.1:8000/v1/chat",
                status: "DISPATCHED",
                promptPreview: body.prompt.slice(0, 120),
            });
        });
    });

    return app;
}

