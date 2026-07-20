# ── Inventory Service ─────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY services/inventory-service/package.json ./services/inventory-service/
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY services/inventory-service ./services/inventory-service
RUN npx prisma generate --schema=services/inventory-service/prisma/schema.prisma
RUN cd services/inventory-service && npx tsc

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/services/inventory-service/dist ./dist
COPY --from=build /app/services/inventory-service/src/generated ./src/generated
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/services/inventory-service/prisma ./prisma
COPY services/inventory-service/docker-entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh
EXPOSE 3005
CMD ["./entrypoint.sh"]
