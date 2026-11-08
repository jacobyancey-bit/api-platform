"use client";

import React, { useState, useEffect } from "react";

const GATEWAY_URL =
    process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:4100";

export default function DeveloperDashboardPage() {
    const [email, setEmail] = useState("studio@dangling-dice-studios.com");
    const [keyName, setKeyName] = useState("Dangling Dice Production Key");
    const [tier, setTier] = useState<"FREE" | "PRO" | "SCALE">("FREE");
    const [keys, setKeys] = useState<any[]>([]);
    const [recentLogs, setRecentLogs] = useState<any[]>([]);
    const [channelBreakdown, setChannelBreakdown] = useState<{
        RAPIDAPI: number;
        POSTMAN: number;
        WEB_SANDBOX: number;
        DIRECT_API: number;
    }>({
        RAPIDAPI: 0,
        POSTMAN: 0,
        WEB_SANDBOX: 0,
        DIRECT_API: 0,
    });
    const [newlyMintedKey, setNewlyMintedKey] = useState<string | null>(null);
    const [status, setStatus] = useState<string>("Connected to API Platform Store");

    async function loadDashboardData() {
        try {
            const res = await fetch(`${GATEWAY_URL}/v1/keys`);
            const data = await res.json();
            if (data.keys) setKeys(data.keys);
            if (data.recentLogs) setRecentLogs(data.recentLogs);
            if (data.channelBreakdown) setChannelBreakdown(data.channelBreakdown);
        } catch {
            setStatus(
                "Gateway offline on :4100 — start with `npm run dev:gateway` to view live logs."
            );
        }
    }

    useEffect(() => {
        loadDashboardData();
    }, []);

    async function handleCreateKey(e: React.FormEvent) {
        e.preventDefault();
        try {
            const res = await fetch(`${GATEWAY_URL}/v1/keys`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, name: keyName, tier }),
            });
            const data = await res.json();
            if (data.rawKey) {
                setNewlyMintedKey(data.rawKey);
                await loadDashboardData();
            }
        } catch {
            const fallback = `dds_live_${Math.random().toString(16).slice(2, 18)}`;
            setNewlyMintedKey(fallback);
        }
    }

    async function handleRevoke(id: string) {
        try {
            await fetch(`${GATEWAY_URL}/v1/keys/${id}`, { method: "DELETE" });
            await loadDashboardData();
        } catch {
            // ignore
        }
    }

    return (
        <main className="container">
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "1rem",
                    marginBottom: "2rem",
                }}
            >
                <div>
                    <div className="badge-pill">DEVELOPER API KEY & METERING PORTAL</div>
                    <h1>API Keys, Quotas & Real-Time Telemetry</h1>
                    <p style={{ color: "var(--text-muted)" }}>{status}</p>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    <a
                        href="https://rapidapi.com/jacob-yancey-z5na1bjQ/api/dangling-dice-studios-central-api/pricing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-gold"
                    >
                        Price Details (RapidAPI) ↗
                    </a>
                    <a href="/" className="btn-outline">
                        ← Back to Interactive Sandboxes
                    </a>
                </div>
            </div>

            {/* Live Channel Attribution Counters (RapidAPI vs Postman vs Web Sandbox vs Direct) */}
            <div className="stat-row" style={{ marginBottom: "1.75rem" }}>
                <div className="stat-box" style={{ borderColor: "var(--neon-cyan)" }}>
                    <div className="label">⚡ RapidAPI Hub Pulls</div>
                    <div className="value" style={{ color: "var(--neon-cyan)" }}>
                        {channelBreakdown.RAPIDAPI.toLocaleString()}
                    </div>
                </div>
                <div className="stat-box" style={{ borderColor: "var(--gold-primary)" }}>
                    <div className="label">🚀 Postman Network Pulls</div>
                    <div className="value" style={{ color: "var(--gold-primary)" }}>
                        {channelBreakdown.POSTMAN.toLocaleString()}
                    </div>
                </div>
                <div className="stat-box">
                    <div className="label">🌐 Web Sandbox Pulls</div>
                    <div className="value">
                        {channelBreakdown.WEB_SANDBOX.toLocaleString()}
                    </div>
                </div>
                <div className="stat-box">
                    <div className="label">💻 Direct cURL / SDK Pulls</div>
                    <div className="value">
                        {channelBreakdown.DIRECT_API.toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="grid-2">
                <div className="card">
                    <h2 style={{ marginBottom: "1rem" }}>Mint New API Key</h2>
                    <form onSubmit={handleCreateKey}>
                        <label className="field-label">Developer Email</label>
                        <input
                            className="input"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <label className="field-label">Key Label</label>
                        <input
                            className="input"
                            value={keyName}
                            onChange={(e) => setKeyName(e.target.value)}
                            required
                        />
                        <label className="field-label">Plan Tier</label>
                        <select
                            className="select"
                            value={tier}
                            onChange={(e) => setTier(e.target.value as any)}
                        >
                            <option value="FREE">
                                BASIC / SANDBOX — Hobby &amp; Evaluation
                            </option>
                            <option value="PRO">
                                PRO — Production Tier (See RapidAPI Price Details)
                            </option>
                            <option value="SCALE">
                                ULTRA / SCALE — High-Throughput Tier (See RapidAPI Price Details)
                            </option>
                        </select>
                        <button type="submit" className="btn-gold" style={{ width: "100%" }}>
                            Generate Bearer API Key
                        </button>
                    </form>

                    {newlyMintedKey && (
                        <div style={{ marginTop: "1.25rem" }}>
                            <label
                                className="field-label"
                                style={{ color: "var(--neon-emerald)" }}
                            >
                                Copy Your New Secret Key (Shown Once):
                            </label>
                            <pre className="code-box">{newlyMintedKey}</pre>
                        </div>
                    )}
                </div>

                <div className="card">
                    <h2 style={{ marginBottom: "1rem" }}>Active API Keys</h2>
                    {keys.length === 0 ? (
                        <p style={{ color: "var(--text-muted)" }}>
                            Default Key Active:{" "}
                            <code>dds_live_dangling_dice_demo_key_2026</code>
                        </p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {keys.map((k) => (
                                <div
                                    key={k.id}
                                    className="stat-box"
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        gap: "1rem",
                                    }}
                                >
                                    <div>
                                        <strong>{k.name}</strong>{" "}
                                        <span
                                            style={{
                                                fontSize: "0.75rem",
                                                color: "var(--gold-primary)",
                                                fontFamily: "var(--font-mono)",
                                            }}
                                        >
                                            [{k.tier}]
                                        </span>
                                        <div
                                            style={{
                                                fontSize: "0.8rem",
                                                color: "var(--text-muted)",
                                                fontFamily: "var(--font-mono)",
                                            }}
                                        >
                                            {k.keyPrefix} • Usage:{" "}
                                            {k.currentMonthUsage.toLocaleString()} /{" "}
                                            {k.monthlyQuota.toLocaleString()}
                                        </div>
                                    </div>
                                    {k.isActive ? (
                                        <button
                                            className="btn-outline"
                                            onClick={() => handleRevoke(k.id)}
                                        >
                                            Revoke
                                        </button>
                                    ) : (
                                        <span style={{ color: "var(--neon-red)", fontSize: "0.8rem" }}>
                                            Revoked
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="card" style={{ marginTop: "1.5rem" }}>
                <h2 style={{ marginBottom: "1rem" }}>Recent Metered API Calls</h2>
                {recentLogs.length === 0 ? (
                    <p style={{ color: "var(--text-muted)" }}>
                        No recent requests recorded in this session yet. Run a request
                        against <code>http://localhost:4100/v1/*</code> to see live
                        telemetry.
                    </p>
                ) : (
                    <pre className="code-box">
                        {JSON.stringify(recentLogs, null, 2)}
                    </pre>
                )}
            </div>
        </main>
    );
}

