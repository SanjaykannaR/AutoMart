#!/bin/sh
set -e

echo "[Auth Service] Starting server..."
exec node dist/index.js
