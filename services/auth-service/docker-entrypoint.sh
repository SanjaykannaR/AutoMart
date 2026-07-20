#!/bin/sh
set -e
echo "[Auth Service] Running Prisma migrations..."
npx prisma migrate deploy --schema=prisma/schema.prisma
echo "[Auth Service] Seeding database..."
node prisma/seed.js || echo "[Auth Service] Seed skipped"
echo "[Auth Service] Starting server..."
exec node dist/index.js
