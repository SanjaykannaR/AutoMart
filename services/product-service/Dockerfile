# ── Product Service ───────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY services/product-service/package.json ./services/product-service/
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY services/product-service ./services/product-service
RUN npx prisma generate --schema=services/product-service/prisma/schema.prisma
RUN cd services/product-service && npx tsc

FROM node:20-alpine
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=build /app/services/product-service/dist ./dist
COPY --from=build /app/services/product-service/src/generated ./src/generated
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/services/product-service/prisma ./prisma
COPY services/product-service/docker-entrypoint.sh ./entrypoint.sh
COPY services/product-service/prisma/seed.js ./prisma/seed.js
RUN chmod +x ./entrypoint.sh
EXPOSE 3002
CMD ["./entrypoint.sh"]
