#!/bin/sh
set -ex

echo "[Product Service] Working directory: $(pwd)"
echo "[Product Service] Files in /app:"
ls -la /app
echo "[Product Service] Files in /app/prisma:"
ls -la /app/prisma
echo "[Product Service] Files in /app/dist:"
ls -la /app/dist
echo "[Product Service] Files in /app/src/generated:"
ls -la /app/src/generated

echo "[Product Service] Running Prisma migrations..."
npx prisma migrate deploy --schema=prisma/schema.prisma

echo "[Product Service] Seeding database..."
node prisma/seed.js || echo "[Product Service] Seed skipped (may already be seeded)"

echo "[Product Service] Starting server..."
exec node dist/index.js
