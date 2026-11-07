"use client";

import React, { useState, useMemo } from "react";
import { inferFromJson } from "@dangling-dice/engine-schema";
import { calculateParcelMetrics } from "@dangling-dice/engine-geo";
import { redactText, RedactionMode } from "@dangling-dice/engine-privacy";
import {
    calculateAmortization,
    simulateExtraPayments,
} from "@dangling-dice/engine-finance";

type EngineTab = "schema" | "geo" | "privacy" | "finance";
type SnippetLang = "curl" | "typescript" | "python";

const GATEWAY_URL =
    process.env.NEXT_PUBLIC_GATEWAY_URL || "https://api.dangling-dice-studios.com";

export default function PlatformLandingPage() {
    const [activeTab, setActiveTab] = useState<EngineTab>("schema");
    const [snippetLang, setSnippetLang] = useState<SnippetLang>("curl");

    // 1. Schema Sandbox State
    const [jsonInput, setJsonInput] = useState<string>(
        JSON.stringify(
            {
                id: "550e8400-e29b-41d4-a716-446655440000",
                studioDivision: "Dangling Dice Coding",
                creatorEmail: "jacob.yancey@danglingdicestudios.com",
                monthlyCalls: 100000,
                isEnterpriseReady: true,
                createdAt: "2026-11-07T17:00:00Z",
            },
            null,
            2
        )
    );
    const [rootName, setRootName] = useState("StudioAccount");
    const [schemaOutputFormat, setSchemaOutputFormat] = useState<
        "zod" | "typescript" | "sqlDdl" | "jsonSchema"
    >("zod");

    // 2. Geo Sandbox State
    const [geoCoordsText, setGeoCoordsText] = useState<string>(
        JSON.stringify(
            [
                [-97.7431, 30.2672],
                [-97.7401, 30.2672],
                [-97.7401, 30.2698],
                [-97.7431, 30.2698],
            ],
            null,
            2
        )
    );

    // 3. Privacy Sandbox State
    const [privacyText, setPrivacyText] = useState<string>(
        "Customer Jacob (jacob.yancey@danglingdicestudios.com) called from (512) 555-0199 with SSN 123-45-6789, Visa 4532-0151-1283-0366, IP 192.168.1.42 and token ap_live_9876543210abcdef."
    );
    const [privacyMode, setPrivacyMode] = useState<RedactionMode>("placeholder");

    // 4. Finance Sandbox State
    const [principal, setPrincipal] = useState<number>(250000);
    const [annualRate, setAnnualRate] = useState<number>(6.5);
    const [termMonths, setTermMonths] = useState<number>(360);
    const [extraMonthly, setExtraMonthly] = useState<number>(300);

    // Tier 2 API Key Generator State
    const [devEmail, setDevEmail] = useState("");
    const [keyName, setKeyName] = useState("My Production App");
    const [generatedKey, setGeneratedKey] = useState<string | null>(
        "dds_live_dangling_dice_demo_key_2026"
    );
    const [keyStatusMsg, setKeyStatusMsg] = useState<string>(
        "Using pre-loaded Dangling Dice Sandbox Key. Enter your email to mint a personal key."
    );

    // Tier 3 Consulting Lead State
    const [leadName, setLeadName] = useState("");
    const [leadEmail, setLeadEmail] = useState("");
    const [leadBudget, setLeadBudget] = useState("$2,500 - $5,000");
    const [leadDetails, setLeadDetails] = useState("");
    const [leadSubmitted, setLeadSubmitted] = useState<string | null>(null);

    // Live Client-Side Engine Evaluations (Zero server latency!)
    const schemaEvaluation = useMemo(() => {
        try {
            return { ok: true as const, data: inferFromJson({ jsonInput, rootName }) };
        } catch (e: any) {
            return { ok: false as const, error: e.message };
        }
    }, [jsonInput, rootName]);

    const geoEvaluation = useMemo(() => {
        try {
            const parsed = JSON.parse(geoCoordsText);
            return {
                ok: true as const,
                data: calculateParcelMetrics({ coordinates: parsed }),
            };
        } catch (e: any) {
            return { ok: false as const, error: e.message };
        }
    }, [geoCoordsText]);

    const privacyEvaluation = useMemo(() => {
        try {
            return {
                ok: true as const,
                data: redactText({ text: privacyText, mode: privacyMode }),
            };
        } catch (e: any) {
            return { ok: false as const, error: e.message };
        }
    }, [privacyText, privacyMode]);

    const financeEvaluation = useMemo(() => {
        try {
            const amort = calculateAmortization({
                principal,
                annualRatePercent: annualRate,
                termMonths,
            });
            const extra = simulateExtraPayments({
                principal,
                annualRatePercent: annualRate,
                termMonths,
                extraMonthlyPayment: extraMonthly,
            });
            return { ok: true as const, amort, extra };
        } catch (e: any) {
            return { ok: false as const, error: e.message };
        }
    }, [principal, annualRate, termMonths, extraMonthly]);

    // Dynamic 1-Line API Code Snippet Generator
    const codeSnippet = useMemo(() => {
        const apiKey = generatedKey || "YOUR_API_KEY";
        let endpoint = "/v1/schema/infer";
        let payloadObj: Record<string, unknown> = {};

        if (activeTab === "schema") {
            endpoint = "/v1/schema/infer";
            payloadObj = { jsonInput, rootName };
        } else if (activeTab === "geo") {
            endpoint = "/v1/geo/parcel-metrics";
            try {
                payloadObj = { coordinates: JSON.parse(geoCoordsText) };
            } catch {
                payloadObj = { coordinates: [] };
            }
        } else if (activeTab === "privacy") {
            endpoint = "/v1/privacy/redact";
            payloadObj = { text: privacyText, mode: privacyMode };
        } else {
            endpoint = "/v1/finance/extra-payments";
            payloadObj = {
                principal,
                annualRatePercent: annualRate,
                termMonths,
                extraMonthlyPayment: extraMonthly,
            };
        }

        const jsonBody = JSON.stringify(payloadObj);

        if (snippetLang === "curl") {
            return `curl -X POST "${GATEWAY_URL}${endpoint}" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '${jsonBody}'`;
        }
        if (snippetLang === "typescript") {
            return `const response = await fetch("${GATEWAY_URL}${endpoint}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json",
  },
  body: JSON.stringify(${JSON.stringify(payloadObj, null, 2)}),
});
const { data } = await response.json();`;
        }
        return `import requests

res = requests.post(
    "${GATEWAY_URL}${endpoint}",
    headers={"Authorization": "Bearer ${apiKey}"},
    json=${JSON.stringify(payloadObj, null, 2)}
)
print(res.json()["data"])`;
    }, [
        activeTab,
        snippetLang,
        generatedKey,
        jsonInput,
        rootName,
        geoCoordsText,
        privacyText,
        privacyMode,
        principal,
        annualRate,
        termMonths,
        extraMonthly,
    ]);

    async function handleGenerateKey(e: React.FormEvent) {
        e.preventDefault();
        if (!devEmail.includes("@")) return;
        try {
            const res = await fetch(`${GATEWAY_URL}/v1/keys`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: devEmail, name: keyName, tier: "FREE" }),
            });
            const data = await res.json();
            if (data.rawKey) {
                setGeneratedKey(data.rawKey);
                setKeyStatusMsg(
                    `Issued Free Tier Key (1,000 calls/mo, 60 req/min) for ${devEmail}. Snippets updated automatically!`
                );
            }
        } catch {
            // Fallback client-side key preview if gateway isn't running locally
            const localKey = `dds_live_${Math.random().toString(16).slice(2, 18)}`;
            setGeneratedKey(localKey);
            setKeyStatusMsg(
                `Generated key ${localKey} for ${devEmail} (Start apps/gateway on :4100 for live persistence).`
            );
        }
    }

    async function handleEnterpriseSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            await fetch(`${GATEWAY_URL}/v1/enterprise/inquiries`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: leadName,
                    email: leadEmail,
                    budgetRange: leadBudget,
                    engineInterest: activeTab,
                    projectDetails: leadDetails,
                }),
            });
        } catch {
            // Non-blocking fallback
        }
        setLeadSubmitted(
            `Thanks ${leadName}! Your custom architecture inquiry (${leadBudget}) has been routed to Dangling Dice Studios™.`
        );
    }

    return (
        <main className="container">
            {/* Hero Section */}
            <section className="hero">
                <div className="badge-pill">
                    <span>⚡ STATELESS COMPUTE ENGINES</span>
                    <span>•</span>
                    <span>SUB-15MS LATENCY</span>
                    <span>•</span>
                    <span>DANGLING-DICE-STUDIOS.COM</span>
                </div>
                <h1>
                    Deterministic Developer Utilities.
                    <br />
                    <span style={{ color: "var(--gold-primary)" }}>
                        Free in Browser. 1 Line of Code via API.
                    </span>
                </h1>
                <p>
                    Zero-dependency TypeScript engines for Schema Conversion, Geospatial Parcel
                    Math, Luhn-Verified PII Redaction, and Financial Amortization. Test instantly
                    below in our client-side sandbox or automate at scale with our metered REST
                    API.
                </p>
            </section>

            {/* Tier 1: Free In-Browser Interactive Sandbox */}
            <section id="sandbox" className="card">
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "1rem",
                        marginBottom: "1rem",
                    }}
                >
                    <div className="tabs-bar" style={{ marginBottom: 0 }}>
                        <button
                            className={`tab-btn ${activeTab === "schema" ? "active" : ""}`}
                            onClick={() => setActiveTab("schema")}
                        >
                            🧩 Engine 1: JSON → Zod / TS / SQL
                        </button>
                        <button
                            className={`tab-btn ${activeTab === "geo" ? "active" : ""}`}
                            onClick={() => setActiveTab("geo")}
                        >
                            🗺️ Engine 2: GIS Parcel & Acreage Math
                        </button>
                        <button
                            className={`tab-btn ${activeTab === "privacy" ? "active" : ""}`}
                            onClick={() => setActiveTab("privacy")}
                        >
                            🛡️ Engine 3: PII & Luhn Redactor
                        </button>
                        <button
                            className={`tab-btn ${activeTab === "finance" ? "active" : ""}`}
                            onClick={() => setActiveTab("finance")}
                        >
                            💰 Engine 4: Loan & Payoff Simulator
                        </button>
                    </div>
                    <span
                        style={{
                            fontSize: "0.78rem",
                            fontFamily: "var(--font-mono)",
                            color: "var(--neon-emerald)",
                        }}
                    >
                        ● Tier 1 Sandbox: Running 100% in-browser (0ms network cost)
                    </span>
                </div>

                {/* Sandbox 1: Schema Engine */}
                {activeTab === "schema" && (
                    <div className="grid-2">
                        <div>
                            <label className="field-label">Root Entity Name</label>
                            <input
                                className="input"
                                value={rootName}
                                onChange={(e) => setRootName(e.target.value)}
                            />
                            <label className="field-label">Sample JSON Payload</label>
                            <textarea
                                className="textarea"
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                            />
                        </div>
                        <div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "0.5rem",
                                }}
                            >
                                <span className="field-label" style={{ marginBottom: 0 }}>
                                    Inferred Output
                                </span>
                                <div style={{ display: "flex", gap: "0.4rem" }}>
                                    {(
                                        ["zod", "typescript", "sqlDdl", "jsonSchema"] as const
                                    ).map((fmt) => (
                                        <button
                                            key={fmt}
                                            className="btn-outline"
                                            style={{
                                                padding: "0.25rem 0.6rem",
                                                fontSize: "0.75rem",
                                                borderColor:
                                                    schemaOutputFormat === fmt
                                                        ? "var(--gold-primary)"
                                                        : undefined,
                                            }}
                                            onClick={() => setSchemaOutputFormat(fmt)}
                                        >
                                            {fmt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <pre className="code-box">
                                {!schemaEvaluation.ok
                                    ? schemaEvaluation.error
                                    : schemaOutputFormat === "jsonSchema"
                                      ? JSON.stringify(
                                            schemaEvaluation.data.jsonSchema,
                                            null,
                                            2
                                        )
                                      : schemaEvaluation.data[schemaOutputFormat]}
                            </pre>
                        </div>
                    </div>
                )}

                {/* Sandbox 2: Geo Engine */}
                {activeTab === "geo" && (
                    <div className="grid-2">
                        <div>
                            <label className="field-label">
                                Polygon Coordinate Ring ([lng, lat] GeoJSON tuples)
                            </label>
                            <textarea
                                className="textarea"
                                value={geoCoordsText}
                                onChange={(e) => setGeoCoordsText(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="field-label">Calculated Parcel Metrics</label>
                            {geoEvaluation.ok ? (
                                <>
                                    <div className="stat-row">
                                        <div className="stat-box">
                                            <div className="label">Acres</div>
                                            <div className="value">
                                                {geoEvaluation.data.areaAcres}
                                            </div>
                                        </div>
                                        <div className="stat-box">
                                            <div className="label">Hectares</div>
                                            <div className="value">
                                                {geoEvaluation.data.areaHectares}
                                            </div>
                                        </div>
                                        <div className="stat-box">
                                            <div className="label">Sq Feet</div>
                                            <div className="value">
                                                {geoEvaluation.data.areaSquareFeet.toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="stat-box">
                                            <div className="label">Perimeter (m)</div>
                                            <div className="value">
                                                {geoEvaluation.data.perimeterMeters}
                                            </div>
                                        </div>
                                    </div>
                                    <pre className="code-box">
                                        {JSON.stringify(geoEvaluation.data, null, 2)}
                                    </pre>
                                </>
                            ) : (
                                <pre className="code-box">{geoEvaluation.error}</pre>
                            )}
                        </div>
                    </div>
                )}

                {/* Sandbox 3: Privacy Engine */}
                {activeTab === "privacy" && (
                    <div className="grid-2">
                        <div>
                            <label className="field-label">Redaction Mode</label>
                            <select
                                className="select"
                                value={privacyMode}
                                onChange={(e) =>
                                    setPrivacyMode(e.target.value as RedactionMode)
                                }
                            >
                                <option value="placeholder">
                                    Placeholder ([REDACTED_EMAIL])
                                </option>
                                <option value="mask">
                                    Format-Preserving Mask (j***@domain.com)
                                </option>
                                <option value="hash">
                                    Deterministic FNV-1a Token Hash ([EMAIL:a9f301bc])
                                </option>
                            </select>
                            <label className="field-label">
                                Unsanitized Text / Logs / LLM Prompt
                            </label>
                            <textarea
                                className="textarea"
                                value={privacyText}
                                onChange={(e) => setPrivacyText(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="field-label">
                                Sanitized Output (Luhn & Checksum Verified)
                            </label>
                            {privacyEvaluation.ok && (
                                <>
                                    <div className="stat-row">
                                        <div className="stat-box">
                                            <div className="label">Total Redacted</div>
                                            <div className="value">
                                                {privacyEvaluation.data.redactionCount}
                                            </div>
                                        </div>
                                        <div className="stat-box">
                                            <div className="label">Cards / SSNs</div>
                                            <div className="value">
                                                {privacyEvaluation.data.countsByCategory
                                                    .credit_card +
                                                    privacyEvaluation.data.countsByCategory.ssn}
                                            </div>
                                        </div>
                                        <div className="stat-box">
                                            <div className="label">Emails / Phones</div>
                                            <div className="value">
                                                {privacyEvaluation.data.countsByCategory.email +
                                                    privacyEvaluation.data.countsByCategory
                                                        .phone}
                                            </div>
                                        </div>
                                    </div>
                                    <pre className="code-box">
                                        {privacyEvaluation.data.sanitizedText}
                                    </pre>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Sandbox 4: Finance Engine */}
                {activeTab === "finance" && (
                    <div className="grid-2">
                        <div>
                            <label className="field-label">Loan Principal ($)</label>
                            <input
                                type="number"
                                className="input"
                                value={principal}
                                onChange={(e) => setPrincipal(Number(e.target.value))}
                            />
                            <label className="field-label">Annual Interest Rate (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                className="input"
                                value={annualRate}
                                onChange={(e) => setAnnualRate(Number(e.target.value))}
                            />
                            <label className="field-label">Term (Months)</label>
                            <input
                                type="number"
                                className="input"
                                value={termMonths}
                                onChange={(e) => setTermMonths(Number(e.target.value))}
                            />
                            <label className="field-label">
                                Extra Monthly Principal Payment ($)
                            </label>
                            <input
                                type="number"
                                className="input"
                                value={extraMonthly}
                                onChange={(e) => setExtraMonthly(Number(e.target.value))}
                            />
                        </div>
                        <div>
                            <label className="field-label">
                                Amortization & Payoff Acceleration Summary
                            </label>
                            {financeEvaluation.ok ? (
                                <>
                                    <div className="stat-row">
                                        <div className="stat-box">
                                            <div className="label">Base Monthly</div>
                                            <div className="value">
                                                ${financeEvaluation.amort.monthlyPayment.toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="stat-box">
                                            <div className="label">Interest Saved</div>
                                            <div className="value" style={{ color: "var(--neon-emerald)" }}>
                                                ${financeEvaluation.extra.interestSaved.toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="stat-box">
                                            <div className="label">Months Shaved</div>
                                            <div className="value">
                                                {financeEvaluation.extra.monthsSaved} mo
                                            </div>
                                        </div>
                                    </div>
                                    <pre className="code-box">
                                        {JSON.stringify(
                                            {
                                                monthlyPayment:
                                                    financeEvaluation.amort.monthlyPayment,
                                                baselineTotalInterest:
                                                    financeEvaluation.extra.baseline
                                                        .totalInterest,
                                                acceleratedTotalInterest:
                                                    financeEvaluation.extra.accelerated
                                                        .totalInterest,
                                                interestSaved:
                                                    financeEvaluation.extra.interestSaved,
                                                monthsSaved:
                                                    financeEvaluation.extra.monthsSaved,
                                                first3Months:
                                                    financeEvaluation.extra.accelerated.schedule.slice(
                                                        0,
                                                        3
                                                    ),
                                            },
                                            null,
                                            2
                                        )}
                                    </pre>
                                </>
                            ) : (
                                <pre className="code-box">{financeEvaluation.error}</pre>
                            )}
                        </div>
                    </div>
                )}

                {/* Sticky 1-Line API Snippet Drawer (Funnel from Tier 1 -> Tier 2) */}
                <div
                    style={{
                        marginTop: "1.75rem",
                        paddingTop: "1.5rem",
                        borderTop: "1px solid var(--border-subtle)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "1rem",
                            marginBottom: "0.75rem",
                        }}
                    >
                        <div>
                            <strong style={{ color: "var(--gold-primary)" }}>
                                ⚡ Automating this? Call our API with 1 line of code:
                            </strong>
                            <span
                                style={{
                                    marginLeft: "0.75rem",
                                    fontSize: "0.82rem",
                                    color: "var(--text-muted)",
                                }}
                            >
                                Live payload synced with your sandbox inputs above
                            </span>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            {(["curl", "typescript", "python"] as const).map((lang) => (
                                <button
                                    key={lang}
                                    className="btn-outline"
                                    style={{
                                        borderColor:
                                            snippetLang === lang
                                                ? "var(--neon-cyan)"
                                                : undefined,
                                    }}
                                    onClick={() => setSnippetLang(lang)}
                                >
                                    {lang.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    <pre className="code-box">{codeSnippet}</pre>
                </div>
            </section>

            {/* Tier 2: Metered Self-Serve Developer API & Instant Key Minting */}
            <section id="pricing" style={{ marginTop: "3.5rem" }}>
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <div className="badge-pill">TIER 2: SELF-SERVE METERED API</div>
                    <h2>Predictable Developer Pricing & Instant API Keys</h2>
                    <p style={{ color: "var(--text-muted)" }}>
                        Start free with 1,000 requests/month. Scale to ratusan/hundreds of
                        thousands of calls with Redis token-bucket rate limiting.
                    </p>
                </div>

                <div className="grid-3">
                    <div className="card">
                        <div className="field-label">FREE SANDBOX & HOBBY</div>
                        <h3 style={{ fontSize: "2rem", margin: "0.4rem 0" }}>
                            $0{" "}
                            <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
                                / month
                            </span>
                        </h3>
                        <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
                            1,000 calls/month • 60 requests/min. Instant API key below.
                        </p>
                        <form onSubmit={handleGenerateKey}>
                            <input
                                className="input"
                                placeholder="you@company.com"
                                value={devEmail}
                                onChange={(e) => setDevEmail(e.target.value)}
                                required
                            />
                            <input
                                className="input"
                                placeholder="Project Name"
                                value={keyName}
                                onChange={(e) => setKeyName(e.target.value)}
                            />
                            <button type="submit" className="btn-gold" style={{ width: "100%" }}>
                                Mint Free API Key →
                            </button>
                        </form>
                        <p
                            style={{
                                marginTop: "0.75rem",
                                fontSize: "0.78rem",
                                fontFamily: "var(--font-mono)",
                                color: "var(--neon-cyan)",
                            }}
                        >
                            {keyStatusMsg}
                        </p>
                    </div>

                    <div
                        className="card"
                        style={{ borderColor: "var(--gold-primary)" }}
                    >
                        <div
                            className="field-label"
                            style={{ color: "var(--gold-primary)" }}
                        >
                            MOST POPULAR — PRO API
                        </div>
                        <h3 style={{ fontSize: "2rem", margin: "0.4rem 0" }}>
                            $29{" "}
                            <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
                                / month
                            </span>
                        </h3>
                        <p style={{ color: "var(--text-muted)", marginBottom: "1.25rem" }}>
                            100,000 calls/month • 300 requests/min • All 4 Compute Engines •
                            Stripe Metered Billing.
                        </p>
                        <a
                            href="https://dangling-dice-studios.com"
                            className="btn-gold"
                            style={{ width: "100%" }}
                        >
                            Upgrade to Pro ($29/mo)
                        </a>
                    </div>

                    <div className="card">
                        <div className="field-label">SCALE & HIGH THROUGHPUT</div>
                        <h3 style={{ fontSize: "2rem", margin: "0.4rem 0" }}>
                            $99{" "}
                            <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
                                / month
                            </span>
                        </h3>
                        <p style={{ color: "var(--text-muted)", marginBottom: "1.25rem" }}>
                            500,000 calls/month • 1,000 requests/min • Priority engineering
                            support from Dangling Dice Studios™.
                        </p>
                        <a
                            href="https://dangling-dice-studios.com"
                            className="btn-outline"
                            style={{ width: "100%" }}
                        >
                            Select Scale ($99/mo)
                        </a>
                    </div>
                </div>
            </section>

            {/* Tier 3: Inbound Custom Architecture & Enterprise VPC Contracts ($2k - $10k+) */}
            <section id="enterprise" className="enterprise-banner">
                <div style={{ flex: "1 1 420px" }}>
                    <div className="badge-pill">
                        TIER 3: CUSTOM ARCHITECTURE & PRIVATE VPC ($2K – $10K+)
                    </div>
                    <h2 style={{ fontSize: "1.75rem", marginBottom: "0.6rem" }}>
                        Need this embedded into your private AWS/GCP VPC or custom B2B stack?
                    </h2>
                    <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
                        When your compliance or throughput demands zero external network hops,
                        Dangling Dice Studios™ architects and deploys dedicated quoting engines,
                        GIS pipelines, and PII sanitization clusters directly inside your cloud.
                    </p>
                </div>

                <form
                    onSubmit={handleEnterpriseSubmit}
                    style={{ flex: "1 1 380px", maxWidth: "480px" }}
                >
                    {leadSubmitted ? (
                        <div className="code-box" style={{ color: "var(--neon-emerald)" }}>
                            {leadSubmitted}
                        </div>
                    ) : (
                        <>
                            <input
                                className="input"
                                placeholder="Your Name & Company"
                                value={leadName}
                                onChange={(e) => setLeadName(e.target.value)}
                                required
                            />
                            <input
                                className="input"
                                type="email"
                                placeholder="Work Email"
                                value={leadEmail}
                                onChange={(e) => setLeadEmail(e.target.value)}
                                required
                            />
                            <select
                                className="select"
                                value={leadBudget}
                                onChange={(e) => setLeadBudget(e.target.value)}
                            >
                                <option value="$2,500 - $5,000">
                                    $2,500 – $5,000 (Private VPC / Custom Engine Integration)
                                </option>
                                <option value="$5,000 - $10,000">
                                    $5,000 – $10,000 (Full B2B Quoting / GIS / Data Pipeline)
                                </option>
                                <option value="$10,000+">
                                    $10,000+ (Dedicated Enterprise Architecture Contract)
                                </option>
                            </select>
                            <textarea
                                className="textarea"
                                style={{ minHeight: "90px" }}
                                placeholder="Tell us about your stack, latency requirements, or custom workflow..."
                                value={leadDetails}
                                onChange={(e) => setLeadDetails(e.target.value)}
                                required
                            />
                            <button type="submit" className="btn-gold" style={{ width: "100%" }}>
                                Request Systems Architecture Consultation →
                            </button>
                        </>
                    )}
                </form>
            </section>
        </main>
    );
}

