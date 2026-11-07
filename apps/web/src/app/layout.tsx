import React from "react";
import "./globals.css";

export const metadata = {
    title: "Dangling Dice Studios™ — Stateless Compute APIs & Developer Sandboxes",
    description:
        "In-browser developer tools and sub-15ms REST APIs for JSON/Zod/SQL Schema Inference, GIS Parcel Acreage Math, PII Redaction, and Loan Amortization.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <header className="site-header">
                    <div className="header-inner">
                        <div>
                            <a href="https://dangling-dice-studios.com" className="brand-title">
                                🎲 Dangling Dice Studios™
                            </a>
                            <span className="brand-sub">/ API & Compute Platform</span>
                        </div>
                        <nav className="nav-links">
                            <a href="/#sandbox">Tier 1: Free Sandboxes</a>
                            <a href="/tools/json-to-zod">SEO Tool Pages</a>
                            <a href="/dashboard">API Key Dashboard</a>
                            <a href="/#pricing">Tier 2: Pricing</a>
                            <a href="/#enterprise">Tier 3: Custom VPC</a>
                            <a
                                href="https://dangling-dice-studios.com"
                                className="btn-outline"
                            >
                                ← Main Studio Hub
                            </a>
                        </nav>
                    </div>
                </header>
                {children}
            </body>
        </html>
    );
}

