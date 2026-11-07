# 🎲 Dangling Dice Studios™ — Stateless Compute API Platform

Official Stateless Compute API Gateway, Pure TypeScript Engine Suite, and Interactive Developer Sandboxes designed to run natively under **[dangling-dice-studios.com](https://dangling-dice-studios.com)**.

---

## 🧩 Compatibility with Your Local Dangling Dice Builds

This monorepo is pre-configured so all of your local repositories can run **simultaneously without port or namespace collisions**:

| Project | Package Scope | Web Port | API / Gateway Port | Database Port | Redis Port |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **`Dangling_Dice_Website`** (`C:\Users\jacob\Dangling_Dice_Website`) | `@dangling-dice/*` | `3000` (Vite) | `5000` (Express) | `27017` (MongoDB) | — |
| **`Code_Craft`** (`C:\Users\jacob\projects\Code_Craft`) | `@codecraft/*` | `3001` | `4000` (Fastify) | `5432` / `5433` (Postgres) | `6379` / `6380` |
| **`API-platform` (This Repo)** (`C:\Users\jacob\projects\API-platform`) | `@dangling-dice/*` | `3100` (Next.js) | `4100` (Fastify) | `5434` (Postgres) | `6381` (Redis) |

### Seamless Integration into `dangling-dice-studios.com`
1. **Direct Workspace Import**: Because all 4 compute engines use the `@dangling-dice/*` scope (`@dangling-dice/engine-schema`, `@dangling-dice/engine-geo`, `@dangling-dice/engine-privacy`, `@dangling-dice/engine-finance`) and compile to pure ES Modules (`"type": "module"`), they can be dropped directly into `C:\Users\jacob\Dangling_Dice_Website\packages\` or imported into any Vite/Next.js/Express app.
2. **Reverse-Proxy Ready**: You can mount `apps/gateway` (`:4100`) behind `https://api.dangling-dice-studios.com` or proxy `/v1/*` from your existing `Dangling_Dice_Website` Vite/Express setup.
3. **Unified Design System**: `apps/web` (`:3100`) uses the exact same CSS custom properties (`--bg-dark`, `--gold-primary`, `--neon-cyan`, `--neon-purple`, `Plus Jakarta Sans`, `JetBrains Mono`) as `Dangling_Dice_Website/apps/web/css/main.css`.

---

## 📁 Monorepo Structure

```text
API-platform/
├── apps/
│   ├── web/                     # @dangling-dice/api-web (Next.js App Router, Port 3100)
│   │                            # Tier 1 Free In-Browser Sandboxes + 1-Line Code Snippets + Tier 2/3 Funnel
│   └── gateway/                 # @dangling-dice/gateway (Fastify API Router, Port 4100)
│                                # Bearer API-Key validation, token-bucket rate limiting, OpenAPI 3.1 spec
├── packages/
│   ├── engine-schema/           # @dangling-dice/engine-schema (JSON -> Zod, TS, SQL DDL, JSON Schema)
│   ├── engine-geo/              # @dangling-dice/engine-geo (Polygon acreage, sq ft, perimeter, Haversine)
│   ├── engine-privacy/          # @dangling-dice/engine-privacy (Luhn card check, PII regex redactor, JSON masking)
│   ├── engine-finance/          # @dangling-dice/engine-finance (Amortization, extra payments, compound interest, NPV/IRR)
│   └── db/                      # @dangling-dice/db (Prisma schema + zero-config in-memory fallback store)
├── docker-compose.yml           # Isolated Postgres (:5434) & Redis (:6381)
├── .env.example                 # Environment template compatible with Dangling_Dice_Website
└── Dangling_Dice_API_Platform.postman_collection.json
```

---

## 🚀 Quick Start Commands

```powershell
# 1. Build all pure TypeScript engines, database layer, and API gateway
npm run build

# 2. Run the full Vitest unit & integration test suite (Engines + DB + Gateway)
npm test

# 3. Start the API Gateway on http://localhost:4100
npm run dev:gateway

# 4. Start the Interactive Sandbox & Developer Portal on http://localhost:3100
npm run dev:web
```
