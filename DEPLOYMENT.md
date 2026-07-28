# AutoMart — Production Deployment Guide

> **Architecture**: Vercel (Frontend) + Railway (Backend Services) + Supabase (PostgreSQL)
>
> **Last updated**: 2026-07-28

---

## Overview

| Platform | What | URL Pattern |
|----------|------|-------------|
| **Vercel** | Next.js frontend | `https://automart.vercel.app` |
| **Railway** | 8 backend microservices + Redis | `https://<service>.up.railway.app` |
| **Supabase** | PostgreSQL database | Already configured |

### Services deployed on Railway

| # | Service | Port | Description |
|---|---------|------|-------------|
| 1 | `api-gateway` | 3000 | Entry point — proxies all `/api/*` traffic |
| 2 | `auth-service` | 3001 | User auth, admin auth, banners |
| 3 | `product-service` | 3002 | Product CRUD, categories |
| 4 | `search-service` | 3003 | Fuzzy search, autocomplete, image search |
| 5 | `order-service` | 3004 | Orders, payments, Stripe |
| 6 | `inventory-service` | 3005 | Stock management |
| 7 | `notification-service` | 3006 | Email notifications, Redis pub/sub |
| 8 | `mcp-server` | 3007 | MCP tools (optional) |
| — | Redis | 6379 | Railway Redis plugin |

---

## Prerequisites

Before you start, you need accounts on:

1. **GitHub** — code is already pushed ✅
2. **Vercel** — https://vercel.com (sign up with GitHub)
3. **Railway** — https://railway.app (sign up with GitHub)
4. **Supabase** — already configured ✅
5. **Stripe** — https://dashboard.stripe.com (test keys ready ✅)

---

## Step 1: Deploy Backend to Railway

### 1.1 Create Railway Project

1. Go to https://railway.app/new
2. Click **"Empty Project"**
3. Name it: **AutoMart**

### 1.2 Add Redis

1. In your AutoMart project, click **"+ New"** → **"Database"** → **"Redis"**
2. Railway creates a Redis instance
3. Click on it → **"Variables"** tab → copy `REDIS_URL`

### 1.3 Add Each Backend Service

For **each** of the 8 services below, click **"+ New"** → **"GitHub Repo"** → select `AutoMart`:

---

#### Service 1: auth-service

| Setting | Value |
|---------|-------|
| **Name** | `auth-service` |
| **Root Directory** | `/services/auth-service` |
| **Watch Pattern** | `src/**` |

**Environment Variables:**

```
JWT_SECRET=<generate-a-64-char-random-string>
JWT_EXPIRES_IN=7d
DATABASE_URL=postgresql://postgres.mmvrkljevwgkonpljsut:JGQQ3%2FdEuaaLs3P@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
REDIS_URL=<paste from Redis plugin>
AUTH_SERVICE_PORT=3001
GOOGLE_CLIENT_ID=<your-google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<your-google-oauth-client-secret>
```

**Build Settings:**
- Build Command: `npm ci && npx prisma generate --schema=services/auth-service/prisma/schema.prisma && cd services/auth-service && npx tsc`
- Start Command: `node services/auth-service/dist/index.js`

---

#### Service 2: product-service

| Setting | Value |
|---------|-------|
| **Name** | `product-service` |
| **Root Directory** | `/services/product-service` |

**Environment Variables:**

```
DATABASE_URL=postgresql://postgres.mmvrkljevwgkonpljsut:JGQQ3%2FdEuaaLs3P@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
PRODUCT_SERVICE_PORT=3002
```

**Build Settings:**
- Build Command: `npm ci && npx prisma generate --schema=services/product-service/prisma/schema.prisma && cd services/product-service && npx tsc`
- Start Command: `node services/product-service/dist/index.js`

---

#### Service 3: search-service

| Setting | Value |
|---------|-------|
| **Name** | `search-service` |
| **Root Directory** | `/services/search-service` |

**Environment Variables:**

```
SEARCH_SERVICE_PORT=3003
```

**Build Settings:**
- Build Command: `npm ci && cd services/search-service && npx tsc`
- Start Command: `node services/search-service/dist/index.js`

---

#### Service 4: order-service

| Setting | Value |
|---------|-------|
| **Name** | `order-service` |
| **Root Directory** | `/services/order-service` |

**Environment Variables:**

```
DATABASE_URL=postgresql://postgres.mmvrkljevwgkonpljsut:JGQQ3%2FdEuaaLs3P@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
REDIS_URL=<paste from Redis plugin>
ORDER_SERVICE_PORT=3004
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
FRONTEND_URL=https://automart.vercel.app
API_URL=https://api-gateway.up.railway.app
```

**Build Settings:**
- Build Command: `npm ci && npx prisma generate --schema=services/order-service/prisma/schema.prisma && cd services/order-service && npx tsc`
- Start Command: `node services/order-service/dist/index.js`

---

#### Service 5: inventory-service

| Setting | Value |
|---------|-------|
| **Name** | `inventory-service` |
| **Root Directory** | `/services/inventory-service` |

**Environment Variables:**

```
DATABASE_URL=postgresql://postgres.mmvrkljevwgkonpljsut:JGQQ3%2FdEuaaLs3P@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
REDIS_URL=<paste from Redis plugin>
INVENTORY_SERVICE_PORT=3005
```

**Build Settings:**
- Build Command: `npm ci && npx prisma generate --schema=services/inventory-service/prisma/schema.prisma && cd services/inventory-service && npx tsc`
- Start Command: `node services/inventory-service/dist/index.js`

---

#### Service 6: notification-service

| Setting | Value |
|---------|-------|
| **Name** | `notification-service` |
| **Root Directory** | `/services/notification-service` |

**Environment Variables:**

```
REDIS_URL=<paste from Redis plugin>
NOTIFICATION_SERVICE_PORT=3006
RESEND_API_KEY=<your-resend-api-key>
```

**Build Settings:**
- Build Command: `npm ci && cd services/notification-service && npx tsc`
- Start Command: `node services/notification-service/dist/index.js`

---

#### Service 7: mcp-server (optional)

| Setting | Value |
|---------|-------|
| **Name** | `mcp-server` |
| **Root Directory** | `/services/mcp-server` |

**Environment Variables:**

```
MCP_SERVER_PORT=3007
```

**Build Settings:**
- Build Command: `npm ci && cd services/mcp-server && npx tsc`
- Start Command: `node services/mcp-server/dist/index.js`

---

#### Service 8: api-gateway (DEPLOY LAST)

| Setting | Value |
|---------|-------|
| **Name** | `api-gateway` |
| **Root Directory** | `/services/api-gateway` |

**Environment Variables:**

```
API_GATEWAY_PORT=3000
JWT_SECRET=<same value as auth-service>
CORS_ORIGINS=https://automart.vercel.app

# Service URLs — use Railway internal networking
# Format: http://<service-name>.railway.internal:<port>
AUTH_SERVICE_URL=http://auth-service.railway.internal:3001
PRODUCT_SERVICE_URL=http://product-service.railway.internal:3002
SEARCH_SERVICE_URL=http://search-service.railway.internal:3003
ORDER_SERVICE_URL=http://order-service.railway.internal:3004
INVENTORY_SERVICE_URL=http://inventory-service.railway.internal:3005
NOTIFICATION_SERVICE_URL=http://notification-service.railway.internal:3006
MCP_SERVER_URL=http://mcp-server.railway.internal:3007
```

**Build Settings:**
- Build Command: `npm ci && cd services/api-gateway && npx tsc`
- Start Command: `node services/api-gateway/dist/index.js`

---

### 1.4 Verify Backend

After all services are deployed:

1. Click on `api-gateway` → **"Settings"** → copy the **Public URL** (e.g. `https://api-gateway.up.railway.app`)
2. Test: `curl https://api-gateway.up.railway.app/health`
3. Test: `curl https://api-gateway.up.railway.app/api/products`

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Connect Repository

1. Go to https://vercel.com/new
2. Import your `AutoMart` GitHub repository
3. Framework: **Next.js** (auto-detected)

### 2.2 Configure Project

| Setting | Value |
|---------|-------|
| **Root Directory** | `apps/web` |
| **Framework Preset** | Next.js |
| **Build Command** | `npx next build` |
| **Output Directory** | `.next` |

### 2.3 Set Environment Variables

In Vercel dashboard → **Settings** → **Environment Variables**:

```
NEXT_PUBLIC_API_URL=https://api-gateway.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://mmvrkljevwgkonpljsut.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tdnJrbGpldndna29ucGxqc3V0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NjM0NTQsImV4cCI6MjEwMDMzOTQ1NH0.d1wq0wAGsnoeL2GVbf6yFocm6Kqg_tXiTXzKFBSO1_Q
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51TwKnG9rZ0AxR31THvWHXQoeWlAyV6jaLI87Zri5bykAWdhI0dJTbdzpFk30aJO4gPbi2pDkHSzqJE8uo1X0H2bA002SBf9dxU
```

### 2.4 Deploy

1. Click **"Deploy"**
2. Wait for build to complete (~2 min)
3. Vercel gives you a URL like `https://automart-xyz.vercel.app`

### 2.5 Custom Domain (Optional)

1. Vercel dashboard → **Settings** → **Domains**
2. Add your custom domain (e.g. `automart.com`)
3. Update DNS as instructed by Vercel

---

## Step 3: Post-Deployment Setup

### 3.1 Run Database Migrations

The Prisma schemas are already applied via Supabase. But if you need to re-run:

```bash
# Connect to Supabase and run the SQL files:
# - supabase/setup.sql (8 tables + RLS)
# - supabase/migration-banners.sql (banners table)
# - supabase/migration-product-storage.sql (product images bucket)
```

### 3.2 Bootstrap Admin User

```bash
curl -X POST https://api-gateway.up.railway.app/api/auth/admin/bootstrap \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@automart.com",
    "password": "AutoMart@2026!",
    "name": "Sanjay Admin"
  }'
```

### 3.3 Seed Products (Optional)

```bash
cd scripts
node seed-users.cjs
node seed-orders.cjs
```

### 3.4 Update Stripe Webhook URL

1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://api-gateway.up.railway.app/api/payments/webhook`
3. Select events: `checkout.session.completed`, `payment_intent.payment_failed`
4. Copy the webhook signing secret → update `STRIPE_WEBHOOK_SECRET` in Railway

---

## Step 4: Verify Everything

### Health Checks

```bash
# API Gateway
curl https://api-gateway.up.railway.app/health

# Frontend
curl https://automart.vercel.app
```

### Test Flows

1. **Homepage**: Visit `https://automart.vercel.app` → hero, categories load
2. **Search**: Type "brake" → products appear
3. **Register**: Create account → redirects to homepage
4. **Login**: Login with admin credentials
5. **Admin**: Visit `/admin` → dashboard shows stats
6. **Cart**: Add item → cart page shows item
7. **Checkout**: Fill address → redirect to Stripe

---

## Environment Variables Reference

### Shared Variables (same value across services)

| Variable | Value | Used By |
|----------|-------|---------|
| `JWT_SECRET` | `<64-char-random-string>` | auth-service, api-gateway |
| `DATABASE_URL` | `postgresql://...` | auth, product, order, inventory |
| `REDIS_URL` | `<from Railway Redis plugin>` | auth, order, inventory, notification |

### Frontend (Vercel)

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api-gateway.up.railway.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://mmvrkljevwgkonpljsut.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (anon key) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` |

### API Gateway

| Variable | Value |
|----------|-------|
| `JWT_SECRET` | same as auth-service |
| `CORS_ORIGINS` | `https://automart.vercel.app` |
| `AUTH_SERVICE_URL` | `http://auth-service.railway.internal:3001` |
| `PRODUCT_SERVICE_URL` | `http://product-service.railway.internal:3002` |
| `SEARCH_SERVICE_URL` | `http://search-service.railway.internal:3003` |
| `ORDER_SERVICE_URL` | `http://order-service.railway.internal:3004` |
| `INVENTORY_SERVICE_URL` | `http://inventory-service.railway.internal:3005` |
| `NOTIFICATION_SERVICE_URL` | `http://notification-service.railway.internal:3006` |
| `MCP_SERVER_URL` | `http://mcp-server.railway.internal:3007` |

### Auth Service

| Variable | Value |
|----------|-------|
| `JWT_SECRET` | `<64-char-random-string>` |
| `JWT_EXPIRES_IN` | `7d` |
| `DATABASE_URL` | `postgresql://...` |
| `REDIS_URL` | `<from Redis plugin>` |
| `GOOGLE_CLIENT_ID` | `<optional>` |
| `GOOGLE_CLIENT_SECRET` | `<optional>` |

### Order Service

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://...` |
| `REDIS_URL` | `<from Redis plugin>` |
| `STRIPE_SECRET_KEY` | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |
| `FRONTEND_URL` | `https://automart.vercel.app` |
| `API_URL` | `https://api-gateway.up.railway.app` |

### Notification Service

| Variable | Value |
|----------|-------|
| `REDIS_URL` | `<from Redis plugin>` |
| `RESEND_API_KEY` | `<optional>` |

---

## Railway Pricing Estimate

| Resource | Plan | Cost |
|----------|------|------|
| 8 Backend Services | Hobby ($5/mo each) | $40/mo |
| Redis | Hobby | $5/mo |
| **Total** | | **~$45/mo** |

> Railway gives you $5 free credit/month on Hobby plan.
> Start with Starter plan ($20/mo) for all services if budget is tight.

### Vercel Pricing

| Resource | Plan | Cost |
|----------|------|------|
| Frontend | Hobby (free) | $0/mo |
| **Total** | | **$0/mo** |

> Vercel Hobby plan is free for personal projects.

---

## Troubleshooting

### Build Fails on Railway

- Check the **Build Logs** in Railway dashboard
- Common issue: Prisma generate fails → ensure `DATABASE_URL` is set
- Common issue: TypeScript errors → check `tsconfig.json` in service

### API Gateway Returns 502

- Backend services haven't started yet → check their deploy logs
- Service URLs wrong → verify `*_SERVICE_URL` env vars use `.railway.internal`

### Frontend Can't Reach API

- `NEXT_PUBLIC_API_URL` must be the **public** Railway URL (not internal)
- CORS error → ensure `CORS_ORIGINS` in api-gateway matches your Vercel URL exactly

### Stripe Payments Fail

- `STRIPE_WEBHOOK_SECRET` must match the webhook endpoint in Stripe Dashboard
- Test with Stripe CLI: `stripe listen --forward-to https://api-gateway.up.railway.app/api/payments/webhook`

---

## Deployment Order

```
1. Redis (Railway plugin)          ← must be first
2. auth-service                    ← needs Redis + Database
3. product-service                 ← needs Database
4. search-service                  ← standalone
5. order-service                   ← needs Redis + Database + Stripe
6. inventory-service               ← needs Redis + Database
7. notification-service            ← needs Redis
8. mcp-server                      ← standalone (optional)
9. api-gateway                     ← needs all services above
10. Vercel frontend                ← needs api-gateway URL
```

**Deploy api-gateway last** — it needs all other services to be running first.
**Update api-gateway URLs** — after deploying each service, copy its Railway internal URL and set it in api-gateway's env vars.
