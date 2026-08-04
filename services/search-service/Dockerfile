# ── Search Service ────────────────────────────────────────────────────────────
# Uses node:20-slim (glibc) NOT alpine (musl) — CLIP loads via onnxruntime-node
# which requires glibc. On alpine the image-search model silently fails to load
# and image search stays disabled (gated by ENABLE_IMAGE_SEARCH).
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY services/search-service/package.json ./services/search-service/
RUN npm ci

FROM node:20-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY services/search-service ./services/search-service
RUN cd services/search-service && npx tsc

FROM node:20-slim
WORKDIR /app
# curl for healthchecks (not present in slim base)
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/services/search-service/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3003
CMD ["node", "dist/index.js"]
