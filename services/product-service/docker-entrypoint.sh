#!/bin/sh
set -e

echo "[Product Service] Starting server..."
exec node dist/index.js
