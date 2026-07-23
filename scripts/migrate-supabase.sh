#!/bin/bash
# ════════════════════════════════════════════════════════════════════════════════
# AutoMart — PostgreSQL Migration Script (Supabase)
# ════════════════════════════════════════════════════════════════════════════════
# This script runs Prisma migrations for all services against Supabase PostgreSQL.
# Usage: bash scripts/migrate-supabase.sh
# ════════════════════════════════════════════════════════════════════════════════

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}AutoMart — PostgreSQL Migration Script (Supabase)${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════════════${NC}"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}ERROR: DATABASE_URL environment variable is not set.${NC}"
  echo "Please set it in .env.docker or export it:"
  echo "  export DATABASE_URL=postgresql://postgres:your-password@db.xxx.supabase.co:5432/postgres"
  exit 1
fi

echo -e "${GREEN}Using DATABASE_URL: ${DATABASE_URL:0:50}...${NC}"
echo ""

# Services to migrate
SERVICES=("auth-service" "product-service" "order-service" "inventory-service")

for SERVICE in "${SERVICES[@]}"; do
  echo -e "${YELLOW}─── Migrating $SERVICE ───${NC}"
  
  # Navigate to service directory
  cd "services/$SERVICE"
  
  # Generate Prisma client
  echo -e "${GREEN}  Generating Prisma client...${NC}"
  npx prisma generate --schema=prisma/schema.prisma
  
  # Run migration
  echo -e "${GREEN}  Running migration...${NC}"
  npx prisma migrate dev --schema=prisma/schema.prisma --name init
  
  # Seed database (only for auth-service and product-service)
  if [ "$SERVICE" = "auth-service" ] || [ "$SERVICE" = "product-service" ]; then
    echo -e "${GREEN}  Seeding database...${NC}"
    node prisma/seed.js
  fi
  
  # Return to root directory
  cd ../..
  
  echo -e "${GREEN}  ✓ $SERVICE migrated successfully${NC}"
  echo ""
done

echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}All services migrated successfully!${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════════════${NC}"
