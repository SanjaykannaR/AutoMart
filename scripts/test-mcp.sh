#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# AutoMart MCP Server — Endpoint Validation Script
# Tests all 5 MCP tools via the API Gateway (port 3000)
# Usage: bash scripts/test-mcp.sh
# ═══════════════════════════════════════════════════════════════

BASE_URL="${BASE_URL:-http://localhost:3000}"
PASS=0
FAIL=0

check() {
  local name="$1"
  local expected="$2"
  local actual="$3"
  if echo "$actual" | grep -q "$expected"; then
    echo "  ✅ PASS — $name"
    PASS=$((PASS + 1))
  else
    echo "  ❌ FAIL — $name (expected '$expected' in response)"
    echo "     Response: $actual"
    FAIL=$((FAIL + 1))
  fi
}

echo "═══════════════════════════════════════════════"
echo " AutoMart MCP Server — Endpoint Validation"
echo "═══════════════════════════════════════════════"
echo ""

# ─── 1. Health Check ───────────────────────────────────────────
echo "1. Gateway Health"
RES=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
CODE=$(echo "$RES" | tail -1)
BODY=$(echo "$RES" | head -n -1)
check "HTTP 200" "200" "$CODE"
check "Status ok" "ok" "$BODY"
echo ""

# ─── 2. MCP Tools Discovery ───────────────────────────────────
echo "2. MCP Tools Discovery (GET /api/mcp/mcp/tools)"
RES=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/mcp/mcp/tools")
CODE=$(echo "$RES" | tail -1)
BODY=$(echo "$RES" | head -n -1)
check "HTTP 200" "200" "$CODE"
check "Protocol present" "model-context-protocol" "$BODY"
check "search_parts tool" "search_parts" "$BODY"
check "check_stock tool" "check_stock" "$BODY"
check "get_order_status tool" "get_order_status" "$BODY"
check "get_categories tool" "get_categories" "$BODY"
check "get_popular_parts tool" "get_popular_parts" "$BODY"
echo ""

# ─── 3. MCP Resources ─────────────────────────────────────────
echo "3. MCP Resources (GET /api/mcp/mcp/resources)"
RES=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/mcp/mcp/resources")
CODE=$(echo "$RES" | tail -1)
BODY=$(echo "$RES" | head -n -1)
check "HTTP 200" "200" "$CODE"
check "Resources present" "resources" "$BODY"
echo ""

# ─── 4. Tool: search_parts ────────────────────────────────────
echo "4. Tool: search_parts"
RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/mcp/mcp/tools/search_parts/call" \
  -H "Content-Type: application/json" \
  -d '{"parameters": {"query": "brake", "limit": 3}}')
CODE=$(echo "$RES" | tail -1)
BODY=$(echo "$RES" | head -n -1)
check "HTTP 200" "200" "$CODE"
check "Status success" "success" "$BODY"
check "Tool name in response" "search_parts" "$BODY"
echo ""

# ─── 5. Tool: check_stock ─────────────────────────────────────
echo "5. Tool: check_stock"
RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/mcp/mcp/tools/check_stock/call" \
  -H "Content-Type: application/json" \
  -d '{"parameters": {"productId": "1"}}')
CODE=$(echo "$RES" | tail -1)
BODY=$(echo "$RES" | head -n -1)
check "HTTP 200" "200" "$CODE"
check "Status success or structured error" "success\|MCP_" "$BODY"
echo ""

# ─── 6. Tool: get_order_status ────────────────────────────────
echo "6. Tool: get_order_status"
RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/mcp/mcp/tools/get_order_status/call" \
  -H "Content-Type: application/json" \
  -d '{"parameters": {"orderId": "test-order-123"}}')
CODE=$(echo "$RES" | tail -1)
BODY=$(echo "$RES" | head -n -1)
check "HTTP 200" "200" "$CODE"
check "Status success or structured error" "success\|MCP_" "$BODY"
echo ""

# ─── 7. Tool: get_categories ──────────────────────────────────
echo "7. Tool: get_categories"
RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/mcp/mcp/tools/get_categories/call" \
  -H "Content-Type: application/json" \
  -d '{"parameters": {}}')
CODE=$(echo "$RES" | tail -1)
BODY=$(echo "$RES" | head -n -1)
check "HTTP 200" "200" "$CODE"
check "Status success" "success" "$BODY"
echo ""

# ─── 8. Tool: get_popular_parts ───────────────────────────────
echo "8. Tool: get_popular_parts"
RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/mcp/mcp/tools/get_popular_parts/call" \
  -H "Content-Type: application/json" \
  -d '{"parameters": {"limit": 5}}')
CODE=$(echo "$RES" | tail -1)
BODY=$(echo "$RES" | head -n -1)
check "HTTP 200" "200" "$CODE"
check "Status success" "success" "$BODY"
echo ""

# ─── 9. Unknown tool returns 404 ──────────────────────────────
echo "9. Unknown tool returns 404"
RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/mcp/mcp/tools/nonexistent/call" \
  -H "Content-Type: application/json" \
  -d '{"parameters": {}}')
CODE=$(echo "$RES" | tail -1)
BODY=$(echo "$RES" | head -n -1)
check "HTTP 404" "404" "$CODE"
check "MCP_TOOL_NOT_FOUND error" "MCP_TOOL_NOT_FOUND" "$BODY"
echo ""

# ─── Summary ──────────────────────────────────────────────────
TOTAL=$((PASS + FAIL))
echo "═══════════════════════════════════════════════"
echo " Results: $PASS/$TOTAL passed, $FAIL failed"
echo "═══════════════════════════════════════════════"

if [ $FAIL -gt 0 ]; then
  exit 1
fi
