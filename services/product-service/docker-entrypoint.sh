#!/bin/sh
set -e

echo "[Product Service] Running Prisma migrations..."
npx prisma migrate deploy --schema=prisma/schema.prisma

echo "[Product Service] Seeding database..."
node prisma/seed.js || echo "[Product Service] Seed skipped (may already be seeded)"

echo "[Product Service] Starting server..."
exec node dist/index.js
