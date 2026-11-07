import "dotenv/config";
import { buildGatewayApp } from "./app.js";

const PORT = Number(process.env.GATEWAY_PORT || process.env.PORT || 4100);
const HOST = process.env.HOST || "0.0.0.0";

const app = buildGatewayApp();

app.listen({ port: PORT, host: HOST })
    .then((address) => {
        console.log(
            `🎲 Dangling Dice Studios™ API Gateway listening at ${address} (Health: ${address}/health | OpenAPI: ${address}/v1/openapi.json)`
        );
    })
    .catch((err) => {
        console.error("Failed to start API Gateway:", err);
        process.exit(1);
    });

