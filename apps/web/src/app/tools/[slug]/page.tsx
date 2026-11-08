import React from "react";
import { ToolSandboxWorkspace } from "../../../components/ToolSandboxWorkspace";
import { STUDIO_TOOLS, ToolSlug } from "../../../components/toolsCatalog";

export function generateStaticParams() {
    return STUDIO_TOOLS.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const tool =
        STUDIO_TOOLS.find((t) => t.slug === slug) || STUDIO_TOOLS[0];
    return {
        title: `${tool.title} | Dangling Dice Studios™ Developer Tools`,
        description: tool.seoSubtitle,
    };
}

export default async function DedicatedToolSeoPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const validSlug = (
        STUDIO_TOOLS.some((t) => t.slug === slug) ? slug : "json-to-zod"
    ) as ToolSlug;

    return (
        <main className="container">
            <div style={{ marginBottom: "1.5rem" }}>
                <a
                    href="/"
                    style={{
                        color: "var(--neon-cyan)",
                        fontSize: "0.88rem",
                        fontFamily: "var(--font-mono)",
                    }}
                >
                    ← All Dangling Dice Studios™ Compute Sandboxes & API Pricing
                </a>
            </div>

            <ToolSandboxWorkspace initialSlug={validSlug} />

            <section className="enterprise-banner">
                <div>
                    <div className="badge-pill">
                        COMMERCIAL API &amp; CUSTOM VPC ARCHITECTURE
                    </div>
                    <h2 style={{ fontSize: "1.5rem", marginBottom: "0.4rem" }}>
                        Need production API access or a private AWS/GCP VPC deployment?
                    </h2>
                    <p style={{ color: "var(--text-muted)" }}>
                        View our commercial rate plans on RapidAPI or request a custom
                        architecture deployment from Dangling Dice Studios™.
                    </p>
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
                    <a href="/#enterprise" className="btn-outline">
                        Book Architecture Call →
                    </a>
                </div>
            </section>
        </main>
    );
}

