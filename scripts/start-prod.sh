#!/bin/bash
# ─── AutoMart Production Startup Script ───────────────────────────────────────
# Starts all backend services as background processes, then runs the API gateway
# in the foreground. Single container, single port (3000), zero Docker networking.
#
# Used by: Render, Railway, or any single-container deployment platform.
# The API gateway is the main process — when it exits, the container stops.
# ──────────────────────────────────────────────────────────────────────────────
set -e

# Colors for logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[start-prod]${NC} $1"; }
warn() { echo -e "${YELLOW}[start-prod]${NC} $1"; }
err() { echo -e "${RED}[start-prod]${NC} $1" >&2; }

# ─── Graceful shutdown ────────────────────────────────────────────────────────
PIDS=()
cleanup() {
  log "Shutting down all services..."
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null
  log "All services stopped."
  exit 0
}
trap cleanup SIGTERM SIGINT SIGHUP

# ─── Port configuration ──────────────────────────────────────────────────────
AUTH_PORT=${AUTH_SERVICE_PORT:-3001}
PRODUCT_PORT=${PRODUCT_SERVICE_PORT:-3002}
SEARCH_PORT=${SEARCH_SERVICE_PORT:-3003}
ORDER_PORT=${ORDER_SERVICE_PORT:-3004}
INVENTORY_PORT=${INVENTORY_SERVICE_PORT:-3005}
NOTIFICATION_PORT=${NOTIFICATION_SERVICE_PORT:-3006}
MCP_PORT=${MCP_SERVER_PORT:-3007}
GATEWAY_PORT=${API_GATEWAY_PORT:-3000}

# ─── Set service URLs for the API gateway (all on localhost) ──────────────────
# The svc() helper in api-gateway prefers *_SERVICE_URL env vars over Docker DNS.
# In single-container mode, all services are on localhost.
export AUTH_SERVICE_URL="${AUTH_SERVICE_URL:-http://localhost:$AUTH_PORT}"
export PRODUCT_SERVICE_URL="${PRODUCT_SERVICE_URL:-http://localhost:$PRODUCT_PORT}"
export SEARCH_SERVICE_URL="${SEARCH_SERVICE_URL:-http://localhost:$SEARCH_PORT}"
export ORDER_SERVICE_URL="${ORDER_SERVICE_URL:-http://localhost:$ORDER_PORT}"
export INVENTORY_SERVICE_URL="${INVENTORY_SERVICE_URL:-http://localhost:$INVENTORY_PORT}"
export NOTIFICATION_SERVICE_URL="${NOTIFICATION_SERVICE_URL:-http://localhost:$NOTIFICATION_PORT}"
export MCP_SERVER_URL="${MCP_SERVER_URL:-http://localhost:$MCP_PORT}"

log "Service URLs configured:"
log "  AUTH:        $AUTH_SERVICE_URL"
log "  PRODUCT:     $PRODUCT_SERVICE_URL"
log "  SEARCH:      $SEARCH_SERVICE_URL"
log "  ORDER:       $ORDER_SERVICE_URL"
log "  INVENTORY:   $INVENTORY_SERVICE_URL"
log "  NOTIFICATION: $NOTIFICATION_SERVICE_URL"
log "  MCP:         $MCP_SERVER_URL"

# ─── Start backend services ──────────────────────────────────────────────────
log "Starting backend services..."

node services/auth-service/dist/index.js &
PIDS+=($!)
log "  auth-service started (PID $!, port $AUTH_PORT)"

node services/product-service/dist/index.js &
PIDS+=($!)
log "  product-service started (PID $!, port $PRODUCT_PORT)"

node services/search-service/dist/index.js &
PIDS+=($!)
log "  search-service started (PID $!, port $SEARCH_PORT)"

node services/order-service/dist/index.js &
PIDS+=($!)
log "  order-service started (PID $!, port $ORDER_PORT)"

node services/inventory-service/dist/index.js &
PIDS+=($!)
log "  inventory-service started (PID $!, port $INVENTORY_PORT)"

node services/notification-service/dist/index.js &
PIDS+=($!)
log "  notification-service started (PID $!, port $NOTIFICATION_PORT)"

node services/mcp-server/dist/index.js &
PIDS+=($!)
log "  mcp-server started (PID $!, port $MCP_PORT)"

# ─── Wait for services to be ready ───────────────────────────────────────────
log "Waiting 3s for services to initialize..."
sleep 3

# ─── Health check ─────────────────────────────────────────────────────────────
FAILED=0
for svc in "auth:$AUTH_PORT" "product:$PRODUCT_PORT" "order:$ORDER_PORT"; do
  NAME=$(echo "$svc" | cut -d: -f1)
  PORT=$(echo "$svc" | cut -d: -f2)
  if curl -sf "http://localhost:$PORT/health" > /dev/null 2>&1; then
    log "  $NAME service: healthy"
  else
    warn "  $NAME service: not responding (may still be starting)"
    FAILED=$((FAILED + 1))
  fi
done

if [ $FAILED -gt 0 ]; then
  warn "$FAILED service(s) not yet healthy — gateway will retry connections."
fi

# ─── Start API gateway (foreground) ──────────────────────────────────────────
log "Starting API gateway on port $GATEWAY_PORT..."
exec node services/api-gateway/dist/index.js
