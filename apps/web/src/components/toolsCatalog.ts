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
        title: "JSON to TypeScript & Database Schema Converter",
        shortTitle: "JSON Schema Converter",
        category: "Schema",
        seoSubtitle:
            "Paste any JSON data to automatically generate TypeScript types, validation schemas, and SQL table definitions.",
        endpoint: "/v1/schema/infer",
        enginePackage: "Schema & Database Suite",
    },
    {
        slug: "sql-to-typescript",
        title: "SQL Table to TypeScript Converter",
        shortTitle: "SQL to TypeScript",
        category: "Schema",
        seoSubtitle:
            "Convert SQL CREATE TABLE statements into clean TypeScript interfaces and data validators.",
        endpoint: "/v1/schema/sql-to-ts",
        enginePackage: "Schema & Database Suite",
    },
    {
        slug: "polygon-acreage-calculator",
        title: "Land Parcel Acreage, Hectares & Perimeter Calculator",
        shortTitle: "Land Acreage Calculator",
        category: "Geo",
        seoSubtitle:
            "Calculate exact land parcel acreage, square footage, hectares, perimeter length, and boundary center from GPS coordinates.",
        endpoint: "/v1/geo/parcel-metrics",
        enginePackage: "Maps, GPS & Network Suite",
    },
    {
        slug: "coordinate-distance-bearing",
        title: "GPS Coordinate Distance, Compass Bearing & Midpoint Calculator",
        shortTitle: "GPS Distance & Bearing",
        category: "Geo",
        seoSubtitle:
            "Compute exact distance (miles, km, meters, feet), compass bearing, and midpoint between any two GPS coordinates.",
        endpoint: "/v1/geo/distance",
        enginePackage: "Maps, GPS & Network Suite",
    },
    {
        slug: "pii-redactor",
        title: "Sensitive Data & Credit Card Log Redactor",
        shortTitle: "Sensitive Text Redactor",
        category: "Privacy",
        seoSubtitle:
            "Automatically scrub emails, SSNs, credit card numbers, phone numbers, IP addresses, and secret keys from text.",
        endpoint: "/v1/privacy/redact",
        enginePackage: "Data Privacy & Security Suite",
    },
    {
        slug: "json-secret-masker",
        title: "JSON Password & Secret Key Masker",
        shortTitle: "JSON Secret Masker",
        category: "Privacy",
        seoSubtitle:
            "Automatically mask passwords, bearer tokens, API keys, SSNs, and CVVs inside nested JSON objects.",
        endpoint: "/v1/privacy/mask-json",
        enginePackage: "Data Privacy & Security Suite",
    },
    {
        slug: "loan-amortization-calculator",
        title: "Loan Amortization Schedule & Extra Payment Payoff Simulator",
        shortTitle: "Loan & Payoff Calculator",
        category: "Finance",
        seoSubtitle:
            "Generate penny-accurate monthly loan payoff schedules and see how extra monthly payments save interest and time.",
        endpoint: "/v1/finance/extra-payments",
        enginePackage: "Finance & Project Suite",
    },
    {
        slug: "compound-interest-calculator",
        title: "Compound Interest, APY Yield & Cash Flow ROI Calculator",
        shortTitle: "Compound Interest & ROI",
        category: "Finance",
        seoSubtitle:
            "Model multi-year investment growth across daily, monthly, or annual compounding alongside Net Present Value (NPV) and ROI.",
        endpoint: "/v1/finance/compound-interest",
        enginePackage: "Finance & Project Suite",
    },
    {
        slug: "software-project-scoping",
        title: "Software Project Scoping, Hours & Deposit Calculator",
        shortTitle: "Software Project Estimator",
        category: "Finance",
        seoSubtitle:
            "Calculate estimated engineering hours, project budget ranges, and 50% milestone deposits based on project scope.",
        endpoint: "/v1/finance/project-scope",
        enginePackage: "Finance & Project Suite",
    },
    {
        slug: "hipaa-telemetry-firewall",
        title: "Healthcare Privacy & Ad-Tracker Scrubber",
        shortTitle: "Healthcare Privacy Scrubber",
        category: "Privacy",
        seoSubtitle:
            "Strip Protected Health Information (PHI) fields and ad-tracking IDs before sending analytics events.",
        endpoint: "/v1/privacy/hipaa-scrub",
        enginePackage: "Data Privacy & Security Suite",
    },
    {
        slug: "database-uri-inspector",
        title: "Database Connection Link Validator & Password Encoder",
        shortTitle: "Database Link Validator",
        category: "Schema",
        seoSubtitle:
            "Validate MongoDB, PostgreSQL, and Redis connection links and safely encode special characters in passwords.",
        endpoint: "/v1/schema/inspect-uri",
        enginePackage: "Schema & Database Suite",
    },
    {
        slug: "wireguard-config-generator",
        title: "WireGuard VPN Config & Tunnel Profile Generator",
        shortTitle: "VPN Config Generator",
        category: "Geo",
        seoSubtitle:
            "Generate ready-to-use WireGuard VPN client and server configuration profiles in one click.",
        endpoint: "/v1/geo/wireguard-config",
        enginePackage: "Maps, GPS & Network Suite",
    },
    {
        slug: "docscanner-qr-bridge",
        title: "Mobile Document Scanner Link & QR Session Builder",
        shortTitle: "Mobile DocScanner Link",
        category: "Geo",
        seoSubtitle:
            "Generate mobile document scanner launch links, QR codes, and upload session configurations.",
        endpoint: "/v1/geo/docscan-session",
        enginePackage: "Maps, GPS & Network Suite",
    },
];
