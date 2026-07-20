FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json tsconfig.json next.config.ts postcss.config.mjs ./
RUN npm ci --omit=dev
COPY src/ ./src/
COPY public/ ./public/
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
