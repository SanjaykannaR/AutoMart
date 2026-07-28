# AutoMart — Production Deployment Guide

> **Architecture**: Vercel (Frontend) + Render (Backend) + Supabase (PostgreSQL) + Upstash (Redis)
>
> **Last updated**: 2026-07-28

---

## Overview

| Platform | What | URL Pattern |
|----------|------|-------------|
| **Vercel** | Next.js frontend | `https://automart.vercel.app` |
| **Render** | All 8 backend services (single container) | `https://automart-backend.onrender.com` |
| **Supabase** | PostgreSQL database | Already configured |
| **Upstash** | Redis (free tier) | Already configured |

### Why Single Container?

Render free tier gives **750 hours/month** and **512MB RAM**. Running 8 separate services would split those resources. Instead, all services run as background processes in **one container** — the API gateway is the only process that listens on the exposed port (3000). This gives you the full 750 hours and sufficient RAM.

---

## Prerequisites

1. **GitHub** — code is already pushed ✅
2. **Vercel** — https://vercel.com (sign up with GitHub)
3. **Render** — https://render.com (sign up with GitHub)
4. **Supabase** — already configured ✅
5. **Stripe** — https://dashboard.stripe.com (test keys ready ✅)
6. **Upstash Redis** — https://upstash.com (free tier: 10K commands/day)

---

## Step 1: Set Up Redis (Upstash — Free)

Railway Redis is no longer available. Use Upstash instead:

1. Go to https://console.upstash.com
2. Click **"Create Database"**
3. Choose **Redis** → Region: closest to your users
4. Plan: **Pay-as-you-go** (free tier: 10K commands/day)
5. Copy the **Redis URL** (format: `rediss://default:<password>@<host>:<port>`)

---

## Step 2: Deploy Backend to Render

### 2.1 Create Render Service

1. Go to https://dashboard.render.com
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repository (`AutoMart`)
4. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `automart-backend` |
| **Runtime** | `Docker` |
| **Dockerfile Path** | `./Dockerfile.prod` |
| **Plan** | `Free` |
| **Health Check Path** | `/health` |

### 2.2 Set Environment Variables

In your Render service → **Environment** tab → add these:

```
# ── Database (same Supabase URL as before) ──
DATABASE_URL=postgresql://postgres.mmvrkljevwgkonpljsut:JGQQ3%2FdEuaaLs3P@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true

# ── Redis (from Upstash) ──
REDIS_URL=<paste your Upstash Redis URL>

# ── Auth ──
JWT_SECRET=<generate a 64-char random string>
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=<your-google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<your-google-oauth-client-secret>

# ── Stripe ──
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# ── URLs ──
FRONTEND_URL=https://automart.vercel.app
CORS_ORIGINS=https://automart.vercel.app

# ── Email (optional — runs in mock mode without this) ──
RESEND_API_KEY=<your-resend-api-key>

# ── Node ──
NODE_ENV=production
```

### 2.3 Deploy

1. Click **"Create Web Service"**
2. Render pulls your repo, builds the Docker image (~3-5 min first time)
3. All 8 services start automatically via the startup script
4. Once deployed, copy your service URL (e.g. `https://automart-backend.onrender.com`)

### 2.4 Verify Backend

```bash
# Health check
curl https://automart-backend.onrender.com/health

# Test products endpoint
curl https://automart-backend.onrender.com/api/products
```

> **Note**: Render free tier services spin down after 15 minutes of inactivity.
> The first request after spin-down takes ~30-60 seconds to respond.
> Subsequent requests are fast.

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Connect Repository

1. Go to https://vercel.com/new
2. Import your `AutoMart` GitHub repository
3. Framework: **Next.js** (auto-detected)

### 3.2 Configure Project

| Setting | Value |
|---------|-------|
| **Root Directory** | `apps/web` |
| **Framework Preset** | Next.js |
| **Build Command** | `npx next build` |
| **Output Directory** | `.next` |

### 3.3 Set Environment Variables

In Vercel dashboard → **Settings** → **Environment Variables**:

```
NEXT_PUBLIC_API_URL=https://automart-backend.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://mmvrkljevwgkonpljsut.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tdnJrbGpldndna29ucGxqc3V0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NjM0NTQsImV4cCI6MjEwMDMzOTQ1NH0.d1wq0wAGsnoeL2GVbf6yFocm6Kqg_tXiTXzKFBSO1_Q
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51TwKnG9rZ0AxR31THvWHXQoeWlAyV6jaLI87Zri5bykAWdhI0dJTbdzpFk30aJO4gPbi2pDkHSzqJE8uo1X0H2bA002SBf9dxU
```

### 3.4 Deploy

1. Click **"Deploy"**
2. Wait for build (~2 min)
3. Vercel gives you a URL like `https://automart-xyz.vercel.app`

---

## Step 4: Post-Deployment Setup

### 4.1 Run Database Migrations

The Prisma schemas are already applied via Supabase. If you need to re-run:

```bash
# Connect to Supabase and run the SQL files:
# - supabase/setup.sql (8 tables + RLS)
# - supabase/migration-banners.sql (banners table)
# - supabase/migration-product-storage.sql (product images bucket)
```

### 4.2 Bootstrap Admin User

```bash
curl -X POST https://automart-backend.onrender.com/api/auth/admin/bootstrap \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@automart.com",
    "password": "AutoMart@2026!"
  }'
```

### 4.3 Seed Products (Optional)

```bash
cd scripts
node seed-users.cjs
node seed-orders.cjs
```

### 4.4 Update Stripe Webhook URL

1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://automart-backend.onrender.com/api/payments/webhook`
3. Select events: `checkout.session.completed`, `payment_intent.payment_failed`
4. Copy the webhook signing secret → update `STRIPE_WEBHOOK_SECRET` in Render

### 4.5 Custom Domain (Optional)

1. Render dashboard → **Settings** → **Custom Domains**
2. Add your domain and update DNS as instructed

---

## Step 5: Verify Everything

### Health Checks

```bash
# Backend (may take 30-60s on first request after spin-down)
curl https://automart-backend.onrender.com/health

# Frontend
curl https://automart.vercel.app
```

### Test Flows

1. **Homepage**: Visit frontend → hero, categories load
2. **Search**: Type "brake" → products appear
3. **Register**: Create account → redirects to homepage
4. **Login**: Login with admin credentials
5. **Admin**: Visit `/admin` → dashboard shows stats
6. **Cart**: Add item → cart page shows item
7. **Checkout**: Fill address → redirect to Stripe

---

## Environment Variables Reference

### Backend (Render)

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | `postgresql://...` | ✅ |
| `REDIS_URL` | `rediss://...` (Upstash) | ✅ |
| `JWT_SECRET` | 64-char random string | ✅ |
| `JWT_EXPIRES_IN` | `7d` | Optional |
| `GOOGLE_CLIENT_ID` | OAuth client ID | Optional |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret | Optional |
| `STRIPE_SECRET_KEY` | `sk_test_...` | ✅ for payments |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | ✅ for webhooks |
| `FRONTEND_URL` | `https://automart.vercel.app` | ✅ |
| `CORS_ORIGINS` | `https://automart.vercel.app` | ✅ |
| `RESEND_API_KEY` | Resend API key | Optional (mock mode) |
| `NODE_ENV` | `production` | ✅ |

### Frontend (Vercel)

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://automart-backend.onrender.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://mmvrkljevwgkonpljsut.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` |

---

## Architecture (Single Container)

```
┌─────────────────────────────────────────────────┐
│  Render Web Service (Docker)                    │
│  Port: 3000 (only exposed port)                 │
│                                                 │
│  ┌─────────────┐  ┌──────────────┐              │
│  │ auth-service │  │product-service│              │
│  │ :3001        │  │ :3002         │              │
│  └─────────────┘  └──────────────┘              │
│  ┌─────────────┐  ┌──────────────┐              │
│  │search-service│  │ order-service │              │
│  │ :3003        │  │ :3004         │              │
│  └─────────────┘  └──────────────┘              │
│  ┌──────────────┐ ┌──────────────┐              │
│  │inventory-svc  │ │notification-svc│             │
│  │ :3005         │ │ :3006          │             │
│  └──────────────┘ └──────────────┘              │
│  ┌─────────────┐                                │
│  │  mcp-server │  ┌──────────────┐              │
│  │ :3007        │  │ api-gateway   │ ◄── :3000   │
│  └─────────────┘  │ (foreground)  │   (exposed)  │
│                    └──────────────┘              │
└─────────────────────────────────────────────────┘
```

All services communicate via `localhost`. The API gateway is the only process exposed to the internet.

---

## Pricing Estimate

| Platform | Plan | Cost |
|----------|------|------|
| Vercel (Frontend) | Hobby | **$0/mo** |
| Render (Backend) | Free | **$0/mo** |
| Supabase (Database) | Free tier | **$0/mo** |
| Upstash (Redis) | Pay-as-you-go | **$0/mo** (10K cmds/day) |
| **Total** | | **$0/mo** |

> **Free tier limitations:**
> - Render: Services spin down after 15 min idle. First request after spin-down takes ~30-60s.
> - Render: 750 hours/month (enough for single service).
> - Upstash: 10K commands/day (enough for moderate traffic).
> - Vercel: 100GB bandwidth/month.

---

## Troubleshooting

### Build Fails on Render

- Check **Build Logs** in Render dashboard
- Common: Prisma generate fails → ensure `DATABASE_URL` is set before deploy
- Common: Out of memory → Render free tier has 512MB, the build should fit

### First Request Is Slow (30-60s)

- **Normal behavior** for Render free tier. The service spins down after 15 min idle.
- After the first request, subsequent requests are fast.
- To prevent spin-down, you can use a cron ping service (e.g. cron-job.org) to hit `/health` every 10 minutes.

### API Gateway Returns 502

- All services start in the background — check Render logs for startup errors
- Ensure `REDIS_URL` is valid (Upstash URL starts with `rediss://`)
- Ensure `DATABASE_URL` points to a reachable Supabase instance

### Frontend Can't Reach API

- `NEXT_PUBLIC_API_URL` must be the **public** Render URL
- CORS error → ensure `CORS_ORIGINS` matches your Vercel URL exactly
- After deploying frontend, update `CORS_ORIGINS` and `FRONTEND_URL` in Render

### Stripe Payments Fail

- `STRIPE_WEBHOOK_SECRET` must match the webhook in Stripe Dashboard
- Test with: `stripe listen --forward-to https://automart-backend.onrender.com/api/payments/webhook`

---

## Deployment Order

```
1. Upstash Redis          ← create and copy URL
2. Render backend         ← set all env vars, deploy
3. Verify backend health  ← curl /health
4. Bootstrap admin user   ← POST /api/auth/admin/bootstrap
5. Vercel frontend        ← set NEXT_PUBLIC_API_URL, deploy
6. Update Stripe webhook  ← point to Render URL
7. Test full flow         ← register, search, add to cart, checkout
```

---

## Updating the Backend

When you push code changes:

1. Render auto-deploys from your `main` branch
2. Docker image rebuilds (~3-5 min)
3. Services restart automatically
4. No manual intervention needed

---

## Switching From Railway

If you previously deployed on Railway:

1. Create a **Upstash Redis** instance and copy the URL
2. Deploy to **Render** following the steps above
3. Update `NEXT_PUBLIC_API_URL` in Vercel to point to Render
4. Update Stripe webhook URL to point to Render
5. You can delete the Railway project after confirming Render works
