@echo off
REM ════════════════════════════════════════════════════════════════════════════════
REM AutoMart — PostgreSQL Migration Script (Supabase) - Windows
REM ════════════════════════════════════════════════════════════════════════════════
REM This script runs Prisma migrations for all services against Supabase PostgreSQL.
REM Usage: scripts\migrate-supabase.bat
REM ════════════════════════════════════════════════════════════════════════════════

echo ════════════════════════════════════════════════════════════════════════════════
echo AutoMart — PostgreSQL Migration Script (Supabase)
echo ════════════════════════════════════════════════════════════════════════════════

REM Check if DATABASE_URL is set
if "%DATABASE_URL%"=="" (
  echo ERROR: DATABASE_URL environment variable is not set.
  echo Please set it in .env.docker or export it.
  exit /b 1
)

echo Using DATABASE_URL: %DATABASE_URL:~0,50%...
echo.

REM Services to migrate
set SERVICES=auth-service product-service order-service inventory-service

for %%S in (%SERVICES%) do (
  echo ─── Migrating %%S ───
  
  REM Navigate to service directory
  cd services\%%S
  
  REM Generate Prisma client
  echo   Generating Prisma client...
  call npx prisma generate --schema=prisma\schema.prisma
  
  REM Run migration
  echo   Running migration...
  call npx prisma migrate dev --schema=prisma\schema.prisma --name init
  
  REM Seed database (only for auth-service and product-service)
  if "%%S"=="auth-service" (
    echo   Seeding database...
    node prisma\seed.js
  )
  if "%%S"=="product-service" (
    echo   Seeding database...
    node prisma\seed.js
  )
  
  REM Return to root directory
  cd ..\..
  
  echo   ✓ %%S migrated successfully
  echo.
)

echo ════════════════════════════════════════════════════════════════════════════════
echo All services migrated successfully!
echo ════════════════════════════════════════════════════════════════════════════════
