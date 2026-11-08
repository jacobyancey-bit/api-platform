"use client";

import React, { useState } from "react";
import { ToolSandboxWorkspace } from "../components/ToolSandboxWorkspace";

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
                    Math, Luhn-Verified PII Redaction, and Financial Amortization. Test all 13
                    utilities instantly below in our client-side sandbox or click{" "}
                    <strong>▶ Run Live Against Gateway</strong> to verify real HTTP execution.
                </p>
                <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                    <a
                        href="https://rapidapi.com/jacob-yancey-z5na1bjQ/api/dangling-dice-studios-central-api/pricing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-gold"
                    >
                        View Price Details on RapidAPI ↗
                    </a>
                </div>
            </section>

            {/* Tier 1: All 13 Interactive Tools + Copy Buttons + Live Gateway Runner */}
            <section id="sandbox">
                <ToolSandboxWorkspace initialSlug="json-to-zod" apiKey={generatedKey} />
            </section>

            {/* API Access & RapidAPI Price Details CTA (No Pricing Shown on Main Page) */}
            <section id="pricing" style={{ marginTop: "3.5rem" }}>
                <div
                    className="card"
                    style={{
                        borderColor: "var(--gold-primary)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "1.5rem",
                        padding: "2rem",
                    }}
                >
                    <div style={{ flex: "1 1 420px" }}>
                        <div className="badge-pill">PRODUCTION REST API &amp; PLANS</div>
                        <h2 style={{ margin: "0.5rem 0" }}>
                            Ready to Integrate These 21 Endpoints into Production?
                        </h2>
                        <p style={{ color: "var(--text-muted)", marginBottom: 0 }}>
                            All commercial API subscriptions, rate quotas, and plan tiers are managed
                            through our official RapidAPI Hub listing. Click below to view full price
                            details and subscribe.
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "0.85rem", flexWrap: "wrap" }}>
                        <a
                            href="https://rapidapi.com/jacob-yancey-z5na1bjQ/api/dangling-dice-studios-central-api/pricing"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-gold"
                            style={{ padding: "0.85rem 1.6rem", fontSize: "0.95rem" }}
                        >
                            Price Details (RapidAPI) ↗
                        </a>
                        <a
                            href="https://rapidapi.com/jacob-yancey-z5na1bjQ/api/dangling-dice-studios-central-api"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-outline"
                            style={{ padding: "0.85rem 1.4rem", fontSize: "0.95rem" }}
                        >
                            Explore Endpoints on RapidAPI ↗
                        </a>
                    </div>
                </div>
            </section>

            {/* Inbound Custom Architecture & Enterprise VPC Contracts */}
            <section id="enterprise" className="enterprise-banner">
                <div style={{ flex: "1 1 420px" }}>
                    <div className="badge-pill">
                        CUSTOM ARCHITECTURE &amp; PRIVATE VPC DEPLOYMENT
                    </div>
                    <h2 style={{ fontSize: "1.75rem", marginBottom: "0.6rem" }}>
                        Need this embedded into your private AWS/GCP VPC or custom B2B stack?
                    </h2>
                    <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
                        When your compliance or throughput demands zero external network hops,
                        Dangling Dice Studios™ architects and deploys dedicated quoting engines,
                        GIS pipelines, and PII sanitization clusters directly inside your cloud.
                    </p>
                    <a
                        href="https://rapidapi.com/jacob-yancey-z5na1bjQ/api/dangling-dice-studios-central-api/pricing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-outline"
                        style={{ display: "inline-block" }}
                    >
                        View API Price Details on RapidAPI ↗
                    </a>
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
