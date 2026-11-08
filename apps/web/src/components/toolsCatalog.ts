export type ToolSlug =
    | "json-to-zod"
    | "sql-to-typescript"
    | "database-uri-inspector"
    | "polygon-acreage-calculator"
    | "coordinate-distance-bearing"
    | "wireguard-config-generator"
    | "docscanner-qr-bridge"
    | "pii-redactor"
    | "json-secret-masker"
    | "hipaa-telemetry-firewall"
    | "loan-amortization-calculator"
    | "compound-interest-calculator"
    | "software-project-scoping";

export interface ToolMetadata {
    slug: ToolSlug;
    title: string;
    shortTitle: string;
    category: "Schema" | "Geo" | "Privacy" | "Finance";
    seoSubtitle: string;
    endpoint: string;
    enginePackage: string;
}

export const STUDIO_TOOLS: ToolMetadata[] = [
    {
        slug: "json-to-zod",
        title: "JSON to Zod, TypeScript, JSON Schema & Postgres SQL Converter",
        shortTitle: "JSON → Zod / TS / SQL",
        category: "Schema",
        seoSubtitle:
            "Paste any JSON payload to deterministically infer Zod validation schemas, TypeScript interfaces, Draft 2020-12 JSON Schema, and PostgreSQL CREATE TABLE statements in 0ms.",
        endpoint: "/v1/schema/infer",
        enginePackage: "@dangling-dice/engine-schema",
    },
    {
        slug: "sql-to-typescript",
        title: "SQL CREATE TABLE to TypeScript Interfaces & Zod Schema Converter",
        shortTitle: "SQL DDL → TypeScript & Zod",
        category: "Schema",
        seoSubtitle:
            "Convert raw SQL CREATE TABLE statements into strictly-typed TypeScript interfaces and Zod runtime validators.",
        endpoint: "/v1/schema/sql-to-ts",
        enginePackage: "@dangling-dice/engine-schema",
    },
    {
        slug: "polygon-acreage-calculator",
        title: "GIS Polygon Acreage, Hectares, Perimeter & Centroid Calculator",
        shortTitle: "Polygon Acreage & GIS Math",
        category: "Geo",
        seoSubtitle:
            "Calculate exact land parcel acreage, square footage, hectares, perimeter length, bounding box, and point-in-polygon checks from GeoJSON coordinates.",
        endpoint: "/v1/geo/parcel-metrics",
        enginePackage: "@dangling-dice/engine-geo",
    },
    {
        slug: "coordinate-distance-bearing",
        title: "Haversine Coordinate Distance, Compass Bearing & Midpoint Calculator",
        shortTitle: "Coordinate Distance & Bearing",
        category: "Geo",
        seoSubtitle:
            "Compute geodesic distance (miles, km, meters, feet), initial compass bearing, and spherical midpoint between any two GPS coordinates.",
        endpoint: "/v1/geo/distance",
        enginePackage: "@dangling-dice/engine-geo",
    },
    {
        slug: "pii-redactor",
        title: "Luhn-Verified PII Redactor & Sensitive Log Sanitizer",
        shortTitle: "PII & Luhn Log Redactor",
        category: "Privacy",
        seoSubtitle:
            "Sanitize emails, SSNs, Luhn-validated credit cards, phone numbers, IPv4 addresses, and API tokens before storing logs or sending prompts to LLMs.",
        endpoint: "/v1/privacy/redact",
        enginePackage: "@dangling-dice/engine-privacy",
    },
    {
        slug: "json-secret-masker",
        title: "Recursive JSON Payload Token & Secret Masker",
        shortTitle: "JSON Secret & Token Masker",
        category: "Privacy",
        seoSubtitle:
            "Recursively traverse nested JSON payloads and mask passwords, bearer tokens, API keys, SSNs, and CVVs while preserving structural types.",
        endpoint: "/v1/privacy/mask-json",
        enginePackage: "@dangling-dice/engine-privacy",
    },
    {
        slug: "loan-amortization-calculator",
        title: "Loan Amortization Schedule & Extra Payment Payoff Simulator",
        shortTitle: "Loan & Extra Payoff Simulator",
        category: "Finance",
        seoSubtitle:
            "Generate penny-accurate monthly loan amortization schedules and simulate how extra monthly or lump-sum payments shave months and interest off your loan.",
        endpoint: "/v1/finance/extra-payments",
        enginePackage: "@dangling-dice/engine-finance",
    },
    {
        slug: "compound-interest-calculator",
        title: "Compound Interest, APY Yield & NPV/IRR Cashflow Calculator",
        shortTitle: "Compound Interest & NPV/IRR",
        category: "Finance",
        seoSubtitle:
            "Model multi-year compound investment growth across daily/monthly/annual frequencies alongside Net Present Value (NPV) and Internal Rate of Return (IRR).",
        endpoint: "/v1/finance/compound-interest",
        enginePackage: "@dangling-dice/engine-finance",
    },
    {
        slug: "software-project-scoping",
        title: "Software Project Scoping, Engineering Hours & Deposit Calculator",
        shortTitle: "Project Quote & Scope (Code_Craft)",
        category: "Finance",
        seoSubtitle:
            "Calculate software engineering hour ranges, cost brackets, and 50% initial deposits from project complexity rules.",
        endpoint: "/v1/finance/project-scope",
        enginePackage: "@dangling-dice/engine-finance",
    },
    {
        slug: "hipaa-telemetry-firewall",
        title: "HIPAA PHI Telemetry Firewall & Ad-Tech Tracker Scrubber",
        shortTitle: "HIPAA PHI Firewall (Titrate-Health)",
        category: "Privacy",
        seoSubtitle:
            "Strip Protected Health Information (PHI) fields and ad-tech tracking IDs (_fbp, gbraid, ttcsid) before sending analytics events to Braze or Segment.",
        endpoint: "/v1/privacy/hipaa-scrub",
        enginePackage: "@dangling-dice/engine-privacy",
    },
    {
        slug: "database-uri-inspector",
        title: "MongoDB, PostgreSQL & Redis Connection URI Inspector & Encoder",
        shortTitle: "DB URI Inspector (Studio Hub)",
        category: "Schema",
        seoSubtitle:
            "Validate database connection strings, RFC-3986 percent-encode special password characters, and generate .env snippets.",
        endpoint: "/v1/schema/inspect-uri",
        enginePackage: "@dangling-dice/engine-schema",
    },
    {
        slug: "wireguard-config-generator",
        title: "WireGuard VPN Tunnel Config & CIDR Subnet IPAM Generator",
        shortTitle: "WireGuard Config (Dangling Dice VPN)",
        category: "Geo",
        seoSubtitle:
            "Generate deterministic WireGuard client .conf profiles, server peer blocks, and 10.66.66.x/32 subnet allocations.",
        endpoint: "/v1/geo/wireguard-config",
        enginePackage: "@dangling-dice/engine-geo",
    },
    {
        slug: "docscanner-qr-bridge",
        title: "Android DocScanner Deep-Link & QR Webhook Session Builder",
        shortTitle: "DocScanner Bridge (Mobile App)",
        category: "Geo",
        seoSubtitle:
            "Generate docscan:// mobile deep links and webhook upload payloads to pair your web app with the Android DocScanner app.",
        endpoint: "/v1/geo/docscan-session",
        enginePackage: "@dangling-dice/engine-geo",
    },
];

