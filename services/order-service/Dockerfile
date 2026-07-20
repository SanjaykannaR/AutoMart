FROM node:20-alpine AS base
WORKDIR /app
COPY package.json tsconfig.json prisma/ ./prisma/
RUN npm ci --omit=dev && npx prisma generate
COPY src/ ./src/
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/prisma ./prisma
EXPOSE 3004
CMD ["node", "dist/index.js"]
