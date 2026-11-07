"use client";

import React, { useState, useMemo } from "react";
import { inferFromJson, sqlToTypeScript } from "@dangling-dice/engine-schema";
import {
    calculateParcelMetrics,
    calculateDistanceAndBearing,
    isPointInPolygon,
} from "@dangling-dice/engine-geo";
import {
    redactText,
    validateLuhn,
    maskJsonPayload,
    RedactionMode,
} from "@dangling-dice/engine-privacy";
import {
    calculateAmortization,
    simulateExtraPayments,
    calculateCompoundInterest,
    calculateCashFlowMetrics,
} from "@dangling-dice/engine-finance";
import { STUDIO_TOOLS, ToolSlug, ToolMetadata } from "./toolsCatalog";

export type { ToolSlug, ToolMetadata };
export { STUDIO_TOOLS };

const GATEWAY_URL =
    process.env.NEXT_PUBLIC_GATEWAY_URL || "https://api.dangling-dice-studios.com";

export function ToolSandboxWorkspace({
    initialSlug = "json-to-zod",
    apiKey = "dds_live_dangling_dice_demo_key_2026",
}: {
    initialSlug?: ToolSlug;
    apiKey?: string;
}) {
    const [activeSlug, setActiveSlug] = useState<ToolSlug>(initialSlug);
    const [snippetLang, setSnippetLang] = useState<"curl" | "typescript" | "python">(
        "curl"
    );

    const activeMeta =
        STUDIO_TOOLS.find((t) => t.slug === activeSlug) || STUDIO_TOOLS[0];

    // States for all 8 tools
    const [jsonInput, setJsonInput] = useState(
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
    const [schemaFmt, setSchemaFmt] = useState<
        "zod" | "typescript" | "sqlDdl" | "jsonSchema"
    >("zod");

    const [sqlInput, setSqlInput] = useState(
        `CREATE TABLE api_subscriptions (\n  id UUID PRIMARY KEY,\n  user_email VARCHAR(255) NOT NULL,\n  monthly_quota INTEGER NOT NULL,\n  is_active BOOLEAN NOT NULL,\n  custom_limits JSONB\n);`
    );

    const [geoCoords, setGeoCoords] = useState(
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
    const [testPointLat, setTestPointLat] = useState(30.2685);
    const [testPointLng, setTestPointLng] = useState(-97.7415);

    const [fromLat, setFromLat] = useState(30.2747);
    const [fromLng, setFromLng] = useState(-97.7404);
    const [toLat, setToLat] = useState(32.7787);
    const [toLng, setToLng] = useState(-96.8089);

    const [privacyText, setPrivacyText] = useState(
        "Customer Jacob (jacob.yancey@danglingdicestudios.com) called from (512) 555-0199 with SSN 123-45-6789, Visa 4532-0151-1283-0366, IP 192.168.1.42 and token ap_live_9876543210abcdef."
    );
    const [privacyMode, setPrivacyMode] = useState<RedactionMode>("placeholder");
    const [luhnCandidate, setLuhnCandidate] = useState("4532 0151 1283 0366");

    const [maskPayloadInput, setMaskPayloadInput] = useState(
        JSON.stringify(
            {
                username: "jacobyancey",
                password: "SuperSecretStudioPassword!",
                billing: {
                    stripe_secret: "sk_live_9876543210abcdef",
                    cvv: "842",
                    plan: "PRO",
                },
            },
            null,
            2
        )
    );

    const [principal, setPrincipal] = useState(250000);
    const [annualRate, setAnnualRate] = useState(6.5);
    const [termMonths, setTermMonths] = useState(360);
    const [extraMonthly, setExtraMonthly] = useState(300);

    const [investPrincipal, setInvestPrincipal] = useState(25000);
    const [investMonthly, setInvestMonthly] = useState(1000);
    const [investRate, setInvestRate] = useState(8.0);
    const [investYears, setInvestYears] = useState(10);

    // Deterministic Engine Evaluations
    const evaluation = useMemo(() => {
        try {
            switch (activeSlug) {
                case "json-to-zod": {
                    const res = inferFromJson({ jsonInput, rootName });
                    return {
                        ok: true as const,
                        payload: { jsonInput, rootName },
                        output:
                            schemaFmt === "jsonSchema"
                                ? JSON.stringify(res.jsonSchema, null, 2)
                                : res[schemaFmt],
                        summary: [
                            { label: "Root Entity", value: res.rootName },
                            { label: "Target Format", value: schemaFmt.toUpperCase() },
                        ],
                    };
                }
                case "sql-to-typescript": {
                    const res = sqlToTypeScript({ sqlDdl: sqlInput });
                    return {
                        ok: true as const,
                        payload: { sqlDdl: sqlInput },
                        output: `${res.typescript}\n\n// --- Zod Runtime Validator ---\n${res.zod}`,
                        summary: [
                            { label: "Table", value: res.tableName },
                            { label: "Columns Parsed", value: String(res.columns.length) },
                        ],
                    };
                }
                case "polygon-acreage-calculator": {
                    const coords = JSON.parse(geoCoords);
                    const res = calculateParcelMetrics({ coordinates: coords });
                    const pip = isPointInPolygon({
                        point: { lat: testPointLat, lng: testPointLng },
                        polygon: coords,
                    });
                    return {
                        ok: true as const,
                        payload: { coordinates: coords },
                        output: JSON.stringify(
                            { ...res, pointInPolygonCheck: pip },
                            null,
                            2
                        ),
                        summary: [
                            { label: "Acres", value: String(res.areaAcres) },
                            { label: "Hectares", value: String(res.areaHectares) },
                            {
                                label: "Sq Feet",
                                value: res.areaSquareFeet.toLocaleString(),
                            },
                            {
                                label: "Test Point Inside?",
                                value: pip.inside ? "YES (Inside)" : "NO (Outside)",
                            },
                        ],
                    };
                }
                case "coordinate-distance-bearing": {
                    const payload = {
                        from: { lat: fromLat, lng: fromLng },
                        to: { lat: toLat, lng: toLng },
                    };
                    const res = calculateDistanceAndBearing(payload);
                    return {
                        ok: true as const,
                        payload,
                        output: JSON.stringify(res, null, 2),
                        summary: [
                            { label: "Miles", value: `${res.distanceMiles} mi` },
                            { label: "Kilometers", value: `${res.distanceKilometers} km` },
                            {
                                label: "Bearing",
                                value: `${res.initialBearingDegrees}° (${res.compassDirection})`,
                            },
                        ],
                    };
                }
                case "pii-redactor": {
                    const res = redactText({ text: privacyText, mode: privacyMode });
                    const luhn = validateLuhn(luhnCandidate);
                    return {
                        ok: true as const,
                        payload: { text: privacyText, mode: privacyMode },
                        output: `${res.sanitizedText}\n\n// --- Luhn Check (${luhnCandidate}) ---\n${JSON.stringify(luhn, null, 2)}`,
                        summary: [
                            {
                                label: "PII Tokens Redacted",
                                value: String(res.redactionCount),
                            },
                            {
                                label: "Card Luhn Check",
                                value: luhn.isValid
                                    ? `VALID (${luhn.network.toUpperCase()})`
                                    : "INVALID",
                            },
                        ],
                    };
                }
                case "json-secret-masker": {
                    const parsed = JSON.parse(maskPayloadInput);
                    const res = maskJsonPayload({ payload: parsed });
                    return {
                        ok: true as const,
                        payload: { payload: parsed },
                        output: JSON.stringify(res, null, 2),
                        summary: [
                            {
                                label: "Fields Masked",
                                value: String(res.maskedFieldCount),
                            },
                            {
                                label: "Paths",
                                value: res.maskedPaths.join(", ") || "None",
                            },
                        ],
                    };
                }
                case "loan-amortization-calculator": {
                    const payload = {
                        principal,
                        annualRatePercent: annualRate,
                        termMonths,
                        extraMonthlyPayment: extraMonthly,
                    };
                    const amort = calculateAmortization(payload);
                    const extra = simulateExtraPayments(payload);
                    return {
                        ok: true as const,
                        payload,
                        output: JSON.stringify(
                            {
                                baseMonthlyPayment: amort.monthlyPayment,
                                interestSaved: extra.interestSaved,
                                monthsSaved: extra.monthsSaved,
                                acceleratedPayoffMonths: extra.accelerated.payoffMonths,
                                first3MonthsSchedule: extra.accelerated.schedule.slice(
                                    0,
                                    3
                                ),
                            },
                            null,
                            2
                        ),
                        summary: [
                            {
                                label: "Monthly Payment",
                                value: `$${amort.monthlyPayment.toLocaleString()}`,
                            },
                            {
                                label: "Interest Saved",
                                value: `$${extra.interestSaved.toLocaleString()}`,
                            },
                            {
                                label: "Months Shaved",
                                value: `${extra.monthsSaved} mo`,
                            },
                        ],
                    };
                }
                case "compound-interest-calculator": {
                    const payload = {
                        principal: investPrincipal,
                        monthlyContribution: investMonthly,
                        annualRatePercent: investRate,
                        years: investYears,
                    };
                    const comp = calculateCompoundInterest(payload);
                    const npvIrr = calculateCashFlowMetrics({
                        discountRatePercent: investRate,
                        cashFlows: [-investPrincipal, 8000, 11000, 14000],
                    });
                    return {
                        ok: true as const,
                        payload,
                        output: JSON.stringify(
                            {
                                finalBalance: comp.finalBalance,
                                totalContributions: comp.totalPrincipalAndContributions,
                                totalInterestEarned: comp.totalInterestEarned,
                                effectiveAnnualYieldPercent:
                                    comp.effectiveAnnualYieldPercent,
                                sampleCashFlowAnalysis: npvIrr,
                                yearlyBreakdown: comp.yearlyBreakdown.slice(-3),
                            },
                            null,
                            2
                        ),
                        summary: [
                            {
                                label: "Final Balance",
                                value: `$${comp.finalBalance.toLocaleString()}`,
                            },
                            {
                                label: "Total Interest",
                                value: `$${comp.totalInterestEarned.toLocaleString()}`,
                            },
                            {
                                label: "APY",
                                value: `${comp.effectiveAnnualYieldPercent}%`,
                            },
                        ],
                    };
                }
            }
        } catch (err: any) {
            return {
                ok: false as const,
                payload: {},
                output: `Error: ${err.message}`,
                summary: [],
            };
        }
    }, [
        activeSlug,
        jsonInput,
        rootName,
        schemaFmt,
        sqlInput,
        geoCoords,
        testPointLat,
        testPointLng,
        fromLat,
        fromLng,
        toLat,
        toLng,
        privacyText,
        privacyMode,
        luhnCandidate,
        maskPayloadInput,
        principal,
        annualRate,
        termMonths,
        extraMonthly,
        investPrincipal,
        investMonthly,
        investRate,
        investYears,
    ]);

    const snippet = useMemo(() => {
        const bodyStr = JSON.stringify(evaluation.payload);
        if (snippetLang === "curl") {
            return `curl -X POST "${GATEWAY_URL}${activeMeta.endpoint}" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '${bodyStr}'`;
        }
        if (snippetLang === "typescript") {
            return `const response = await fetch("${GATEWAY_URL}${activeMeta.endpoint}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json",
  },
  body: JSON.stringify(${JSON.stringify(evaluation.payload, null, 2)}),
});
const { data } = await response.json();`;
        }
        return `import requests

res = requests.post(
    "${GATEWAY_URL}${activeMeta.endpoint}",
    headers={"Authorization": "Bearer ${apiKey}"},
    json=${JSON.stringify(evaluation.payload, null, 2)}
)
print(res.json()["data"])`;
    }, [activeMeta, evaluation.payload, snippetLang, apiKey]);

    return (
        <div className="card">
            {/* Tool Selector Bar */}
            <div className="tabs-bar">
                {STUDIO_TOOLS.map((tool) => (
                    <button
                        key={tool.slug}
                        className={`tab-btn ${activeSlug === tool.slug ? "active" : ""}`}
                        onClick={() => setActiveSlug(tool.slug)}
                    >
                        {tool.shortTitle}
                    </button>
                ))}
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                    }}
                >
                    <h2 style={{ fontSize: "1.35rem" }}>{activeMeta.title}</h2>
                    <span
                        style={{
                            fontSize: "0.78rem",
                            fontFamily: "var(--font-mono)",
                            color: "var(--neon-cyan)",
                        }}
                    >
                        {activeMeta.enginePackage} • {activeMeta.endpoint}
                    </span>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.92rem" }}>
                    {activeMeta.seoSubtitle}
                </p>
            </div>

            {/* Input / Output Split Grid */}
            <div className="grid-2">
                <div>
                    {activeSlug === "json-to-zod" && (
                        <>
                            <label className="field-label">Root Interface / Table Name</label>
                            <input
                                className="input"
                                value={rootName}
                                onChange={(e) => setRootName(e.target.value)}
                            />
                            <label className="field-label">Input JSON Payload</label>
                            <textarea
                                className="textarea"
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                            />
                        </>
                    )}

                    {activeSlug === "sql-to-typescript" && (
                        <>
                            <label className="field-label">SQL CREATE TABLE Statement</label>
                            <textarea
                                className="textarea"
                                value={sqlInput}
                                onChange={(e) => setSqlInput(e.target.value)}
                            />
                        </>
                    )}

                    {activeSlug === "polygon-acreage-calculator" && (
                        <>
                            <label className="field-label">
                                Polygon Ring Coordinates ([lng, lat])
                            </label>
                            <textarea
                                className="textarea"
                                value={geoCoords}
                                onChange={(e) => setGeoCoords(e.target.value)}
                            />
                            <div className="stat-row">
                                <div>
                                    <label className="field-label">Test Point Lat</label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        className="input"
                                        value={testPointLat}
                                        onChange={(e) =>
                                            setTestPointLat(Number(e.target.value))
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="field-label">Test Point Lng</label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        className="input"
                                        value={testPointLng}
                                        onChange={(e) =>
                                            setTestPointLng(Number(e.target.value))
                                        }
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {activeSlug === "coordinate-distance-bearing" && (
                        <div className="stat-row">
                            <div>
                                <label className="field-label">Origin Lat</label>
                                <input
                                    type="number"
                                    step="0.001"
                                    className="input"
                                    value={fromLat}
                                    onChange={(e) => setFromLat(Number(e.target.value))}
                                />
                                <label className="field-label">Origin Lng</label>
                                <input
                                    type="number"
                                    step="0.001"
                                    className="input"
                                    value={fromLng}
                                    onChange={(e) => setFromLng(Number(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="field-label">Destination Lat</label>
                                <input
                                    type="number"
                                    step="0.001"
                                    className="input"
                                    value={toLat}
                                    onChange={(e) => setToLat(Number(e.target.value))}
                                />
                                <label className="field-label">Destination Lng</label>
                                <input
                                    type="number"
                                    step="0.001"
                                    className="input"
                                    value={toLng}
                                    onChange={(e) => setToLng(Number(e.target.value))}
                                />
                            </div>
                        </div>
                    )}

                    {activeSlug === "pii-redactor" && (
                        <>
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
                                    Partial Mask (j***@domain.com)
                                </option>
                                <option value="hash">
                                    Deterministic Hash ([EMAIL:a9f301bc])
                                </option>
                            </select>
                            <label className="field-label">Raw Text / Log Stream</label>
                            <textarea
                                className="textarea"
                                value={privacyText}
                                onChange={(e) => setPrivacyText(e.target.value)}
                            />
                            <label className="field-label">
                                Direct Credit Card Luhn Check
                            </label>
                            <input
                                className="input"
                                value={luhnCandidate}
                                onChange={(e) => setLuhnCandidate(e.target.value)}
                            />
                        </>
                    )}

                    {activeSlug === "json-secret-masker" && (
                        <>
                            <label className="field-label">
                                Nested JSON Object with Sensitive Keys
                            </label>
                            <textarea
                                className="textarea"
                                value={maskPayloadInput}
                                onChange={(e) => setMaskPayloadInput(e.target.value)}
                            />
                        </>
                    )}

                    {activeSlug === "loan-amortization-calculator" && (
                        <>
                            <label className="field-label">Loan Principal ($)</label>
                            <input
                                type="number"
                                className="input"
                                value={principal}
                                onChange={(e) => setPrincipal(Number(e.target.value))}
                            />
                            <label className="field-label">Annual Rate (%)</label>
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
                            <label className="field-label">Extra Monthly Payment ($)</label>
                            <input
                                type="number"
                                className="input"
                                value={extraMonthly}
                                onChange={(e) => setExtraMonthly(Number(e.target.value))}
                            />
                        </>
                    )}

                    {activeSlug === "compound-interest-calculator" && (
                        <>
                            <label className="field-label">Initial Principal ($)</label>
                            <input
                                type="number"
                                className="input"
                                value={investPrincipal}
                                onChange={(e) =>
                                    setInvestPrincipal(Number(e.target.value))
                                }
                            />
                            <label className="field-label">Monthly Contribution ($)</label>
                            <input
                                type="number"
                                className="input"
                                value={investMonthly}
                                onChange={(e) => setInvestMonthly(Number(e.target.value))}
                            />
                            <label className="field-label">Annual Return (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                className="input"
                                value={investRate}
                                onChange={(e) => setInvestRate(Number(e.target.value))}
                            />
                            <label className="field-label">Horizon (Years)</label>
                            <input
                                type="number"
                                className="input"
                                value={investYears}
                                onChange={(e) => setInvestYears(Number(e.target.value))}
                            />
                        </>
                    )}
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
                            Deterministic Engine Output
                        </span>
                        {activeSlug === "json-to-zod" && (
                            <div style={{ display: "flex", gap: "0.4rem" }}>
                                {(
                                    ["zod", "typescript", "sqlDdl", "jsonSchema"] as const
                                ).map((fmt) => (
                                    <button
                                        key={fmt}
                                        className="btn-outline"
                                        style={{
                                            padding: "0.2rem 0.55rem",
                                            fontSize: "0.75rem",
                                            borderColor:
                                                schemaFmt === fmt
                                                    ? "var(--gold-primary)"
                                                    : undefined,
                                        }}
                                        onClick={() => setSchemaFmt(fmt)}
                                    >
                                        {fmt}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {evaluation.summary.length > 0 && (
                        <div className="stat-row">
                            {evaluation.summary.map((item) => (
                                <div key={item.label} className="stat-box">
                                    <div className="label">{item.label}</div>
                                    <div className="value">{item.value}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    <pre className="code-box">{evaluation.output}</pre>
                </div>
            </div>

            {/* Sticky 1-Line API Call Drawer */}
            <div
                style={{
                    marginTop: "1.5rem",
                    paddingTop: "1.25rem",
                    borderTop: "1px solid var(--border-subtle)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "0.75rem",
                        marginBottom: "0.65rem",
                    }}
                >
                    <div>
                        <strong style={{ color: "var(--gold-primary)" }}>
                            ⚡ Automating this? Call our API with 1 line of code:
                        </strong>
                        <span
                            style={{
                                marginLeft: "0.6rem",
                                fontSize: "0.8rem",
                                color: "var(--text-muted)",
                            }}
                        >
                            Direct SEO Link:{" "}
                            <a
                                href={`/tools/${activeMeta.slug}`}
                                style={{
                                    color: "var(--neon-cyan)",
                                    textDecoration: "underline",
                                }}
                            >
                                /tools/{activeMeta.slug}
                            </a>
                        </span>
                    </div>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                        {(["curl", "typescript", "python"] as const).map((lang) => (
                            <button
                                key={lang}
                                className="btn-outline"
                                style={{
                                    padding: "0.3rem 0.7rem",
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
                <pre className="code-box">{snippet}</pre>
            </div>
        </div>
    );
}

