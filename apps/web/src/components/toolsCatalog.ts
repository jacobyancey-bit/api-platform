export type ToolSlug =
    | "json-to-zod"
    | "sql-to-typescript"
    | "polygon-acreage-calculator"
    | "coordinate-distance-bearing"
    | "pii-redactor"
    | "json-secret-masker"
    | "loan-amortization-calculator"
    | "compound-interest-calculator";

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
];

