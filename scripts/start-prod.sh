#!/bin/bash
# ─── AutoMart Production Startup Script ───────────────────────────────────────
# Starts backend services as background processes, then runs the API gateway
# in the foreground. Single container, single port (3000), zero Docker networking.
#
# Used by: Render, Railway, or any single-container deployment platform.
# The API gateway is the main process — when it exits, the container stops.
#
# MEMORY: Render free tier has 512MB. Heavy/optional services are OFF by default:
#   - assistant-service (RAG + ~300MB embedding model) → enable with ENABLE_ASSISTANT=true
#   - mcp-server (dev tool)                            → enable with ENABLE_MCP=true
# Node heap is capped per process to keep total usage bounded.
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
ASSISTANT_PORT=${ASSISTANT_SERVICE_PORT:-3008}
GATEWAY_PORT=${API_GATEWAY_PORT:-3000}

# ─── Optional services (off by default to fit 512MB free tier) ───────────────
ENABLE_ASSISTANT=${ENABLE_ASSISTANT:-false}
ENABLE_MCP=${ENABLE_MCP:-false}

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
export ASSISTANT_SERVICE_URL="${ASSISTANT_SERVICE_URL:-http://localhost:$ASSISTANT_PORT}"

log "Service URLs configured:"
log "  AUTH:        $AUTH_SERVICE_URL"
log "  PRODUCT:     $PRODUCT_SERVICE_URL"
log "  SEARCH:      $SEARCH_SERVICE_URL"
log "  ORDER:       $ORDER_SERVICE_URL"
log "  INVENTORY:   $INVENTORY_SERVICE_URL"
log "  NOTIFICATION: $NOTIFICATION_SERVICE_URL"
log "  MCP:         $MCP_SERVER_URL (enabled=$ENABLE_MCP)"
log "  ASSISTANT:   $ASSISTANT_SERVICE_URL (enabled=$ENABLE_ASSISTANT)"

# ─── Heap caps (MB) — keep total RSS within 512MB on free tier ───────────────
NODE_OPTS_AUTH="--max-old-space-size=96"
NODE_OPTS_PRODUCT="--max-old-space-size=96"
NODE_OPTS_SEARCH="--max-old-space-size=80"
NODE_OPTS_ORDER="--max-old-space-size=96"
NODE_OPTS_INVENTORY="--max-old-space-size=80"
NODE_OPTS_NOTIFICATION="--max-old-space-size=64"
NODE_OPTS_ASSISTANT="--max-old-space-size=96"
NODE_OPTS_MCP="--max-old-space-size=64"
NODE_OPTS_GATEWAY="--max-old-space-size=64"

# ─── Start backend services ──────────────────────────────────────────────────
log "Starting backend services..."

# Start the API gateway FIRST so port 3000 is the first port Render detects.
# Render's Docker port detection scans shortly after boot; if the gateway
# started last, Render can pick an earlier-open port (e.g. 3002) as primary.
node $NODE_OPTS_GATEWAY services/api-gateway/dist/index.js &
GATEWAY_PID=$!
log "  api-gateway started (PID $GATEWAY_PID, port $GATEWAY_PORT)"

node $NODE_OPTS_AUTH services/auth-service/dist/index.js &
PIDS+=($!)
log "  auth-service started (PID $!, port $AUTH_PORT)"

node $NODE_OPTS_PRODUCT services/product-service/dist/index.js &
PIDS+=($!)
log "  product-service started (PID $!, port $PRODUCT_PORT)"

node $NODE_OPTS_SEARCH services/search-service/dist/index.js &
PIDS+=($!)
log "  search-service started (PID $!, port $SEARCH_PORT)"

node $NODE_OPTS_ORDER services/order-service/dist/index.js &
PIDS+=($!)
log "  order-service started (PID $!, port $ORDER_PORT)"

node $NODE_OPTS_INVENTORY services/inventory-service/dist/index.js &
PIDS+=($!)
log "  inventory-service started (PID $!, port $INVENTORY_PORT)"

node $NODE_OPTS_NOTIFICATION services/notification-service/dist/index.js &
PIDS+=($!)
log "  notification-service started (PID $!, port $NOTIFICATION_PORT)"

if [ "$ENABLE_MCP" = "true" ]; then
  node $NODE_OPTS_MCP services/mcp-server/dist/index.js &
  PIDS+=($!)
  log "  mcp-server started (PID $!, port $MCP_PORT)"
else
  warn "  mcp-server SKIPPED (set ENABLE_MCP=true to enable)"
fi

if [ "$ENABLE_ASSISTANT" = "true" ]; then
  node $NODE_OPTS_ASSISTANT services/assistant-service/dist/index.js &
  PIDS+=($!)
  log "  assistant-service started (PID $!, port $ASSISTANT_PORT)"
else
  warn "  assistant-service SKIPPED (set ENABLE_ASSISTANT=true to enable)"
fi

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

# ─── Keep the container alive until the API gateway exits ────────────────────
log "All services started. Gateway is the main process (port $GATEWAY_PORT)."
wait $GATEWAY_PID
