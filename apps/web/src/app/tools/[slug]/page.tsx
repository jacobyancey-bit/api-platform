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
                        TIER 3: CUSTOM ENTERPRISE ARCHITECTURE ($2K – $10K+)
                    </div>
                    <h2 style={{ fontSize: "1.5rem", marginBottom: "0.4rem" }}>
                        Need a custom version of this engine deployed inside your private
                        AWS/GCP VPC?
                    </h2>
                    <p style={{ color: "var(--text-muted)" }}>
                        Dangling Dice Studios™ builds bespoke quoting calculators, GIS
                        parcel pipelines, and zero-trust PII scrubbers for engineering
                        teams.
                    </p>
                </div>
                <a href="/#enterprise" className="btn-gold">
                    Book Systems Architecture Call →
                </a>
            </section>
        </main>
    );
}

