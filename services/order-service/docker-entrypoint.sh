#!/bin/sh
set -e

echo "[Order Service] Starting server..."
exec node dist/index.js
