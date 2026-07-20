# ── Order Service ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY services/order-service/package.json ./services/order-service/
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json ./
COPY services/order-service ./services/order-service
RUN npx prisma generate --schema=services/order-service/prisma/schema.prisma
RUN cd services/order-service && npx tsc

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/services/order-service/dist ./dist
COPY --from=build /app/services/order-service/src/generated ./src/generated
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/services/order-service/prisma ./prisma
COPY services/order-service/docker-entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh
EXPOSE 3004
CMD ["./entrypoint.sh"]
