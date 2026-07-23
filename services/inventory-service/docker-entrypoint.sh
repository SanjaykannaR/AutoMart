#!/bin/sh
set -e

echo "[Inventory Service] Starting server..."
exec node dist/index.js
