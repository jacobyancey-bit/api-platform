# Step 4: Distribution & RapidAPI / Postman Launch Guide

## 1. Upload `openapi.json` to RapidAPI
1. Open [RapidAPI Studio](https://rapidapi.com/studio) (under your existing Dangling Dice Studios account).
2. Create a new API project or add a version to your Dangling Dice Studios API.
3. Choose **Import OpenAPI Spec** and upload [openapi.json](file:///c:/Users/jacob/projects/API-platform/openapi.json) from the root of this repository.
4. Set the Base URL to your deployed gateway (`https://api.dangling-dice-studios.com`).

## 2. Publish Postman Collection to the Postman Public API Network
1. Open Postman and click **Import**.
2. Select [Dangling_Dice_API_Platform.postman_collection.json](file:///c:/Users/jacob/projects/API-platform/Dangling_Dice_API_Platform.postman_collection.json).
3. All 5 folders come pre-configured with `{{gatewayUrl}}` and the demo key `dds_live_dangling_dice_demo_key_2026`.

## 3. Ready-to-Post Dev.to / Peerlist Technical Breakdown

### Title:
**How I Built a Sub-15ms Stateless Compute API & Free Browser Sandbox Using Shared TypeScript Monorepo Packages**

### Body Snippet:
Most developer utility sites force you to choose between a clunky ad-filled web calculator or an overpriced enterprise SaaS API.

At **Dangling Dice Studios™** (`https://dangling-dice-studios.com`), we solved this with a **Pure Core / Imperative Shell** TypeScript monorepo:
- `@dangling-dice/engine-schema`: Infers **Zod**, **TypeScript interfaces**, **JSON Schema**, and **Postgres DDL** from raw JSON in <1ms.
- `@dangling-dice/engine-geo`: Computes geodesic polygon **acreage, square footage, perimeter, and centroid** from GeoJSON coordinate rings.
- `@dangling-dice/engine-privacy`: Scrubs **Luhn-validated credit cards, SSNs, emails, phones, and nested JSON secrets** before logs hit storage or LLMs.
- `@dangling-dice/engine-finance`: Generates penny-reconciled **loan amortization schedules, extra-payment payoff simulations, and NPV/IRR metrics**.

Because every engine has **zero external HTTP calls and zero Node-only dependencies**, the exact same TypeScript functions run:
1. **Free inside the browser** on our interactive sandboxes (`/tools/json-to-zod`, `/tools/polygon-acreage-calculator`, `/tools/pii-redactor`, `/tools/loan-amortization-calculator`) at $0 server cost.
2. **Inside our Fastify API Gateway** for developers who want 1-line cURL/TypeScript/Python automation.

