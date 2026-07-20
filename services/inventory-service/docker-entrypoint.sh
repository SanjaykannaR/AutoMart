#!/bin/sh
set -e

echo "[Inventory Service] Running Prisma migrations..."
npx prisma migrate deploy --schema=prisma/schema.prisma

echo "[Inventory Service] Starting server..."
exec node dist/index.js
