# ── API Gateway ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY services/api-gateway/package.json ./services/api-gateway/
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json ./
COPY services/api-gateway ./services/api-gateway
RUN cd services/api-gateway && npx tsc

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/services/api-gateway/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/index.js"]
