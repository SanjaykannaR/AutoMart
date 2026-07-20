# ── Auth Service ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY services/auth-service/package.json ./services/auth-service/
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY services/auth-service ./services/auth-service
RUN npx prisma generate --schema=services/auth-service/prisma/schema.prisma
RUN cd services/auth-service && npx tsc

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/services/auth-service/dist ./dist
COPY --from=build /app/services/auth-service/src/generated ./src/generated
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/services/auth-service/prisma ./prisma
COPY services/auth-service/docker-entrypoint.sh ./entrypoint.sh
COPY services/auth-service/prisma/seed.js ./prisma/seed.js
RUN chmod +x ./entrypoint.sh
EXPOSE 3001
CMD ["./entrypoint.sh"]
