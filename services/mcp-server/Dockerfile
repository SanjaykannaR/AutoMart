# ── MCP Server ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY services/mcp-server/package.json ./services/mcp-server/
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY services/mcp-server ./services/mcp-server
RUN cd services/mcp-server && npx tsc

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/services/mcp-server/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3007
CMD ["node", "dist/index.js"]
