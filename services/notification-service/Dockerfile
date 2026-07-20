# ── Notification Service ──────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY services/notification-service/package.json ./services/notification-service/
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY services/notification-service ./services/notification-service
RUN cd services/notification-service && npx tsc

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/services/notification-service/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3006
CMD ["node", "dist/index.js"]
