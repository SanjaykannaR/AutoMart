#!/bin/sh
set -e

echo "[Order Service] Running Prisma migrations..."
npx prisma migrate deploy --schema=prisma/schema.prisma

echo "[Order Service] Starting server..."
exec node dist/index.js
