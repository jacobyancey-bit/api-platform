"use client";

import React, { useState } from "react";
import { ToolSandboxWorkspace } from "../../components/ToolSandboxWorkspace";

const GATEWAY_URL =
    process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:4100";

export default function PlatformLandingPage() {
    // Tier 2 API Key Generator State
    const [devEmail, setDevEmail] = useState("");
    const [keyName, setKeyName] = useState("My Production App");
    const [generatedKey, setGeneratedKey] = useState<string>(
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
                    `Issued Free Tier Key (1,000 calls/mo, 60 req/min) for ${devEmail}. Sandbox snippets & live runner updated automatically!`
                );
            }
        } catch {
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
                    engineInterest: "Full Compute Suite / Custom VPC",
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
                    Math, Luhn-Verified PII Redaction, and Financial Amortization. Test all 8
                    utilities instantly below in our client-side sandbox or click{" "}
                    <strong>▶ Run Live Against Gateway</strong> to verify real HTTP execution.
                </p>
            </section>

            {/* Tier 1: All 8 Interactive Tools + Copy Buttons + Live Gateway Runner */}
            <section id="sandbox">
                <ToolSandboxWorkspace initialSlug="json-to-zod" apiKey={generatedKey} />
            </section>

            {/* Tier 2: Metered Self-Serve Developer API & Instant Key Minting */}
            <section id="pricing" style={{ marginTop: "3.5rem" }}>
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <div className="badge-pill">TIER 2: SELF-SERVE METERED API</div>
                    <h2>Predictable Developer Pricing & Instant API Keys</h2>
                    <p style={{ color: "var(--text-muted)" }}>
                        Start free with 1,000 requests/month. Scale to hundreds of thousands of
                        calls with token-bucket rate limiting.
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

                    <div className="card" style={{ borderColor: "var(--gold-primary)" }}>
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
                            href="/dashboard"
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
                            href="/dashboard"
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
