# 🎲 Dangling Dice Studios™ — Distribution & Copy-Paste Launch Pack

All 4 launch templates below are 100% ready to copy and paste onto **Dev.to / Hashnode**, **Reddit (`r/webdev`, `r/node`, `r/SideProject`)**, **Hacker News (`Show HN`)**, and **LinkedIn / X**.

---

## 1. Dev.to / Hashnode Article (Copy & Paste)

**Title**:
`How I Built a Sub-5ms Stateless Compute API Suite & 13 Free Browser Sandboxes in a Single TypeScript Monorepo`

**Tags**:
`typescript`, `webdev`, `node`, `opensource`

**Body**:
```markdown
Most developer utility sites force you to choose between an ad-cluttered web calculator that steals your clipboard data or an overpriced enterprise SaaS API that takes 400ms to respond.

At **Dangling Dice Studios™** (https://dangling-dice-studios.com), I wanted to build a suite of deterministic developer tools where **the exact same pure TypeScript functions** power:
1. **13 Free In-Browser Developer Sandboxes** (0ms network latency, $0 server compute cost, zero data retention)
2. **A Sub-5ms Metered Fastify REST API Gateway** (for CI/CD pipelines, webhooks, and backend microservices)

Here is how the architecture works and how you can use all 13 tools for free today.

---

### The Architecture: Pure Core, Imperative Shell

Instead of coupling business logic to Next.js server actions or Express controllers, every algorithm lives in a zero-dependency TypeScript workspace package:

1. **`@dangling-dice/engine-schema` (`/v1/schema/*`)**
   - **JSON to Zod, TypeScript, JSON Schema & Postgres DDL**: Infers nested types, arrays, UUIDs, ISO timestamps, and nullable fields in `<2ms`.
   - **SQL `CREATE TABLE` to TypeScript & Zod**: Parses Postgres/MySQL DDL into strict runtime validators.
   - **Database Connection String Doctor**: Validates MongoDB (`mongodb+srv://`), PostgreSQL, and Redis URIs and automatically RFC-3986 percent-encodes raw `@`, `:`, `/`, `#`, and `?` characters in passwords.

2. **`@dangling-dice/engine-finance` (`/v1/finance/*`)**
   - **Penny-Accurate Loan Amortization & Extra Payment Simulator**: Reconciles final-month rounding drift to the exact cent.
   - **Cash Flow NPV, IRR & Payback Engine**: Newton-Raphson Internal Rate of Return and Net Present Value calculator.
   - **Software Engineering Project Scoping Engine**: Calculates low/high engineering hour brackets, total cost ranges, and 50% milestone deposits.

3. **`@dangling-dice/engine-geo` (`/v1/geo/*`)**
   - **GIS Polygon Acreage & Perimeter**: Geodesic spherical excess acreage, square footage, hectares, perimeter, and centroid from GeoJSON coordinate rings.
   - **Haversine Distance & Compass Bearing**: Exact geodesic distance, initial bearing, and midpoint.
   - **WireGuard `.conf` Tunnel Generator**: Deterministic `/24` IPAM peer allocator and client/server config generator.
   - **DocScanner Session Builder**: Generates Android deep links (`docscanner://scan`) and QR webhook upload payloads.

4. **`@dangling-dice/engine-privacy` (`/v1/privacy/*`)**
   - **Luhn Credit Card & Regex PII Redactor**: Validates 13–19 digit payment cards via Luhn checksum before redacting (eliminating false positives on order IDs) alongside SSNs, emails, phones, IPv4s, and API keys.
   - **Recursive JSON Secret Masker**: Scrubs `password`, `token`, `secret`, `api_key`, and `ssn` keys at any nesting depth before logging.
   - **HIPAA Telemetry & Tracker Scrubber**: Strips 18 HIPAA PHI identifiers and ad-tech tracking IDs (`fbclid`, `gclid`, `_ga`) from analytics payloads.

---

### Try It in 1 Second via cURL (or Postman)

Every endpoint accepts our public sandbox key (`dds_live_dangling_dice_demo_key_2026`):

```bash
curl -X POST https://dangling-dice-studios.com/v1/schema/infer \
  -H "Authorization: Bearer dds_live_dangling_dice_demo_key_2026" \
  -H "Content-Type: application/json" \
  -d '{
    "rootName": "PaymentWebhook",
    "jsonInput": {
      "transactionId": "550e8400-e29b-41d4-a716-446655440000",
      "customerEmail": "dev@dangling-dice-studios.com",
      "amountCents": 2900,
      "settled": true
    }
  }'
```

- **Interactive Web Sandboxes**: https://dangling-dice-studios.com
- **OpenAPI 3.0.3 Spec**: https://dangling-dice-studios.com/api/openapi.json
- **Postman Collection JSON**: https://raw.githubusercontent.com/jacobyancey-bit/api-platform/main/Dangling_Dice_API_Platform.postman_collection.json

Feedback and feature requests for new stateless engines are super welcome!
```

---

## 2. Reddit Post (`r/SideProject`, `r/webdev`, `r/node`)

**Title**:
`I built 13 free in-browser developer tools (JSON-to-Zod, SQL-to-TS, Connection String Doctor, HIPAA/PII Scrubber, GIS Acreage) backed by a 5ms stateless REST API`

**Body**:
```markdown
Hey everyone! Over the past few months across several projects at **Dangling Dice Studios**, I kept rewriting the same deterministic utilities:
- Converting messy webhook JSON into **Zod + TypeScript + Postgres DDL**
- Fixing broken `mongodb+srv://` and `postgresql://` connection strings when passwords contain unencoded `@`, `:`, or `#` characters
- Scrubbing **Luhn-verified credit cards, SSNs, and HIPAA PHI fields** out of JSON logs before sending them to observability tools or LLMs
- Computing **GIS polygon acreage**, **WireGuard peer configs**, **loan amortization schedules**, and **software project hour/deposit estimates**

Instead of leaving them buried inside private repos, I extracted all of them into pure, zero-dependency TypeScript engines that run **100% client-side in the browser for free** (no login, no ads, zero payload storage), and exposed the exact same engines via a **sub-5ms Fastify REST API**.

**Links to try them out:**
- **Main Studio & Interactive Sandboxes**: https://dangling-dice-studios.com
- **Direct Postman Collection (18 Endpoints with pre-filled Sandbox Key)**: https://raw.githubusercontent.com/jacobyancey-bit/api-platform/main/Dangling_Dice_API_Platform.postman_collection.json
- **OpenAPI 3.0.3 Spec**: https://dangling-dice-studios.com/api/openapi.json

Let me know if there's another deterministic transform or validator you wish existed as both a clean browser tool and a 1-line cURL endpoint!
```

---

## 3. Hacker News (`Show HN`)

**Title**:
`Show HN: Dangling Dice Compute – Sub-5ms stateless REST APIs and browser sandboxes in pure TS`

**Body**:
```text
Hi HN, I built Dangling Dice Stateless Compute (https://dangling-dice-studios.com) after realizing how many backend tasks (JSON-to-Zod/SQL AST generation, Luhn-checked PII/HIPAA log scrubbing, RFC-3986 database URI repair, geodesic polygon acreage, and penny-reconciled loan amortization) don't need a database or an LLM—they just need fast, deterministic math.

Each engine is written as a pure TypeScript package with zero I/O dependencies. That lets the exact same code run in-browser at $0 server cost for interactive use, and inside a Fastify gateway averaging 2ms-5ms per request for automated CI/CD or webhook pipelines.

You can test all 13 sandboxes in the browser or import the 18-endpoint Postman collection directly:
https://raw.githubusercontent.com/jacobyancey-bit/api-platform/main/Dangling_Dice_API_Platform.postman_collection.json
```

---

## 4. LinkedIn / X (Twitter) Launch Post

```text
Just shipped the Dangling Dice Studios™ Stateless Compute API Platform 🎲⚡

We extracted 13 of our internal TypeScript engines across FinTech, AST Schema Compilation, GIS/Network Config, and HIPAA/PCI Privacy into:
✅ 13 Free In-Browser Developer Sandboxes (0ms latency, zero data storage)
✅ 21 Unified REST API Endpoints on RapidAPI & Postman averaging 5ms response time:
• JSON → Zod / TypeScript / Postgres DDL
• SQL CREATE TABLE → TypeScript & Zod
• Database Connection String Doctor (RFC-3986 auto-encoder)
• HIPAA PHI & Luhn Credit Card Log Firewall
• GIS Polygon Acreage, Haversine Distance & WireGuard Config Generator
• Penny-Accurate Loan Amortization & Software Project Scoping Engine

Try the sandboxes or grab the OpenAPI 3.0 / Postman Collection at:
https://dangling-dice-studios.com
```
