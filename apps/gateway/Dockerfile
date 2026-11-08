FROM node:22-alpine AS base
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/gateway ./apps/gateway

RUN npm ci
RUN npm run build

EXPOSE 4100
ENV NODE_ENV=production
ENV GATEWAY_PORT=4100
ENV HOST=0.0.0.0

CMD ["npm", "run", "start:gateway"]

