# ── Search Service ────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY services/search-service/package.json ./services/search-service/
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY services/search-service ./services/search-service
RUN cd services/search-service && npx tsc

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/services/search-service/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3003
CMD ["node", "dist/index.js"]
