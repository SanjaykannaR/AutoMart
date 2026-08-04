# ── Assistant Service (RAG chatbot backend) ───────────────────────────────────
# Uses node:20-slim (glibc) NOT alpine (musl) — @huggingface/transformers loads
# onnxruntime-node which requires glibc. On alpine the MiniLM model fails to
# load and the service silently falls back to deterministic embeddings.
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY services/assistant-service/package.json ./services/assistant-service/
RUN npm ci

FROM node:20-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY services/assistant-service ./services/assistant-service
RUN cd services/assistant-service && npx tsc

FROM node:20-slim
WORKDIR /app
# curl for healthchecks (not present in slim base)
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/services/assistant-service/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3008
CMD ["node", "dist/index.js"]
