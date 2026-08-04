# AutoMart Production Deployment Guide

Step-by-step guide to deploy AutoMart to production. Last updated: **2026-08-02**.

---

## Architecture

```
GitHub: SanjaykannaR/AutoMart  (branch: main)
│
├── 🖥️ BACKEND  → Render  → https://automart-backend-f1ic.onrender.com
│     Single Docker container (Dockerfile.prod) running ALL 8 services:
│     api-gateway (foreground, port 3000) + auth/product/search/order/inventory/
│     notification/mcp/assistant on ports 3001-3008 (started by scripts/start-prod.sh)
│
└── 🌐 FRONTEND → Vercel  → https://auto-mart-web.vercel.app
      apps/web (Next.js 15), deployed as the ONLY service (see vercel.json)
      Calls backend via NEXT_PUBLIC_API_URL
```

External URL scheme: every frontend call goes to `https://automart-backend-f1ic.onrender.com/api/<prefix>/...`
(the gateway proxies `/api/products`, `/api/auth`, `/api/payments`, ... to the internal services).

---

## Current status (2026-08-02)

| Item | Status |
|---|---|
| Turnstile bot protection (code) | ✅ Done, merged to main (`2504823`) |
| `vercel.json` → services schema, web-only | ✅ Done, pushed to main (`af66f1b`) |
| Render service created | ✅ `automart-backend-f1ic` (Language: Docker, free plan) |
| Render env vars | ⚠️ Partially — still missing 3 secrets |
| Vercel project import | ⏸️ Paused on import screen (Deploy button was disabled) |
| Vercel env vars | ✅ 4 of 5 added (site key pending) |
| Cloudflare Turnstile keys | ❌ Not created yet |
| Stripe webhook secret | ❌ Not created yet |
| Google OAuth JS origin | ❌ Not added yet |

---

## Part 0 — Accounts needed

| Service | Used for | Dashboard |
|---|---|---|
| GitHub | Source repo | github.com |
| Render | Backend hosting | dashboard.render.com |
| Vercel | Frontend hosting | vercel.com/dashboard |
| Supabase | PostgreSQL + image storage | supabase.com/dashboard |
| Upstash | Redis (queue/cache/OTP) | console.upstash.com |
| Cloudflare | Turnstile bot protection | dash.cloudflare.com → Turnstile |
| Google Cloud | OAuth (login with Google) | console.cloud.google.com |
| Stripe | Payments (test mode) | dashboard.stripe.com/test |

---

## Part 1 — Backend on Render

### 1.1 Create the service
1. dashboard.render.com → **New + → Web Service** → connect GitHub repo `AutoMart`
2. Name: `automart-backend`, Region: any, **Language: Docker** (auto-detected from `Dockerfile.prod` via `render.yaml`)
3. `render.yaml` already declares: `runtime: docker`, `dockerfilePath: Dockerfile.prod`, `healthCheckPath: /health`, `plan: free`
4. Because Language = Docker, **Build/Start Command fields are locked** — that's correct, ignore them.
5. Add the env vars below → **Create Web Service** → first deploy takes ~5-10 min (Docker build).
6. Done when the URL responds: `curl https://automart-backend-f1ic.onrender.com/health`

### 1.2 Environment variables (Render → your service → Environment)

**Required — set all of these:**

| Key | Value (or where to get it) |
|---|---|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | copy from local `.env.docker`; if missing generate: `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | `7d` |
| `DATABASE_URL` | copy from `.env.docker` (Supabase Postgres connection string) |
| `REDIS_URL` | `rediss://default:<PASSWORD>@positive-muskrat-151421.upstash.io:6379` — replace `<PASSWORD>` with your Upstash password (console.upstash.com → your DB → Details). ⚠️ Must be `rediss://` with password — the plain REST URL won't work with ioredis |
| `CORS_ORIGINS` | `https://auto-mart-web.vercel.app` |
| `FRONTEND_URL` | `https://auto-mart-web.vercel.app` (used by Stripe redirects) |
| `API_URL` | `https://automart-backend-f1ic.onrender.com` |
| `GOOGLE_CLIENT_ID` | `1052100778533-joctd4ti47huu58f8d1nc7uep39bdbl1.apps.googleusercontent.com` |
| `STRIPE_SECRET_KEY` | `sk_test_...` (copy from `.env.docker`) |
| `STRIPE_WEBHOOK_SECRET` | ❌ PENDING — see Part 3, step 3.2 |
| `TURNSTILE_SECRET_KEY` | ❌ PENDING — see Part 3, step 3.1 |
| `LLM_PROVIDER` | `template` (no `LLM_API_KEY` needed for template) |

**Optional — skip unless you need real email:**
`RESEND_API_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` (notification service falls back to mock mode without them).

**Do NOT set:** `PORT`, `API_GATEWAY_PORT`, `*_SERVICE_URL` — `scripts/start-prod.sh` auto-configures all internal ports/URLs (gateway on 3000, services on 3001-3008, all localhost).

**After any env change:** Service → Manual Deploy → **Clear build cache & deploy**.

---

## Part 2 — Frontend on Vercel

### 2.1 The gotcha that blocked us (read this before importing)
Vercel scans your repo, sees **8 services** (`services/*`), and force-locks the new
**"Services" application preset** — you cannot switch it to Next.js from the UI.
That preset validates `vercel.json` against the services schema, where top-level keys like
`rootDirectory`/`framework`/`buildCommand`/`env` are **illegal** → error
*"should NOT have additional property `rootDirectory`"*.

**Fix (committed):** root `vercel.json` now declares ONLY the web app using the current `services` schema — note `mountPath` is no longer valid, and a top-level `rewrites` rule is required to expose the service publicly:

```json
{
  "services": {
    "web": {
      "root": "apps/web",
      "framework": "nextjs"
    }
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": { "service": "web" }
    }
  ]
}
```

### 2.2 Import steps
1. vercel.com/dashboard → **Add New… → Project** → Import Git Repository → `SanjaykannaR/AutoMart` → branch **main**
2. It will re-detect the services preset — this is now OK because `vercel.json` is valid
3. **Project Name:** `auto-mart-web`
4. **Root Directory:** leave as `apps/web` (service `root` also points there)
5. Build Command: leave locked (auto-detected `nextjs` framework in `apps/web`)
6. Add env vars below (tick **Production** and **Preview**)
7. **Deploy** — should now be enabled (if not, paste the error; see Troubleshooting)

### 2.3 Environment variables (Vercel → Settings → Environment Variables)

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://automart-backend-f1ic.onrender.com` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `1052100778533-joctd4ti47huu58f8d1nc7uep39bdbl1.apps.googleusercontent.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://mmvrkljevwgkonpljsut.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tdnJrbGpldndna29ucGxqc3V0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NjM0NTQsImV4cCI6MjEwMDMzOTQ1NH0.d1wq0wAGsnoeL2GVbf6yFocm6Kqg_tXiTXzKFBSO1_Q` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | ❌ PENDING — see Part 3, step 3.1 |

⚠️ `NEXT_PUBLIC_*` vars only apply after a **fresh deploy** (they're baked at build time).

---

## Part 3 — Obtain the 3 missing secrets

### 3.1 Cloudflare Turnstile (site key → Vercel, secret key → Render)
1. dash.cloudflare.com → **Turnstile → Add Site**
2. Site name: `auto-mart-web`; **Hostname:** `auto-mart-web.vercel.app`
3. Widget mode: **Managed** (non-interactive), leave the rest default → **Create**
4. Copy both keys:
   - **Site Key** → Vercel `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
   - **Secret Key** → Render `TURNSTILE_SECRET_KEY` (copy immediately — shown once)

### 3.2 Stripe webhook (secret → Render)
1. dashboard.stripe.com/test → **Developers → Webhooks → Add endpoint**
2. Endpoint URL: `https://automart-backend-f1ic.onrender.com/api/payments/webhook`
3. Events: **`checkout.session.completed`** (the app marks orders paid on this event)
4. Create → click the endpoint → **Reveal signing secret** → copy `whsec_...`
5. That value → Render `STRIPE_WEBHOOK_SECRET`

### 3.3 Google OAuth — allow your site
Your login uses the browser popup flow — **no client secret needed** (backend verifies the
id_token with just `GOOGLE_CLIENT_ID`). But Google must allow the origin:
1. console.cloud.google.com → your project → **APIs & Services → Credentials** → your OAuth 2.0 Client ID
2. **Authorized JavaScript origins:** add `https://auto-mart-web.vercel.app` and `http://localhost:3000`
3. (No redirect URIs needed for the popup flow.)
4. If you ever switch to server-side code flow, you'll need the client secret — skip that for now.

---

## Part 4 — Wire in and redeploy

1. Add the 3 new values: Render (`TURNSTILE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) and Vercel (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`)
2. Render → Manual Deploy → Clear build cache & deploy
3. Vercel → Deployments → Redeploy (or push a commit)
4. Confirm Render health: `curl https://automart-backend-f1ic.onrender.com/health` → 200

---

## Part 5 — Verification checklist

- [ ] `https://auto-mart-web.vercel.app` loads, home page shows products from the API
- [ ] Search works (hits `GET /api/search` on Render)
- [ ] Register with email → Turnstile widget visible + OTP email/mock code works
- [ ] Login with Google → popup opens, login succeeds (proves JS origin + client ID OK)
- [ ] Add to cart → checkout → Stripe test card `4242 4242 4242 4242` → order marked paid
- [ ] Admin login at `/admin/login` works
- [ ] Product/banner image upload to Supabase works

---

## Troubleshooting

| Symptom | Cause / Fix |
|---|---|
| Vercel: "should NOT have additional property rootDirectory" | Old-style root `vercel.json` invalid under services preset → use the services-schema file (already committed) |
| Vercel Deploy disabled after fix | Refresh/re-open the import so Vercel re-reads the repo; check project name is filled |
| Vercel: "unknown property `experimentalServices`" | Schema renamed → change key `experimentalServices` → `services` |
| Vercel: "should NOT have additional property `mountPath`" | `mountPath` was removed in the new `services` schema — drop it; routing is done via top-level `rewrites` instead |
| Site loads but returns 404 / blank | Services are internal by default — a top-level `rewrites` rule must target the service: `{ "source": "/(.*)", "destination": { "service": "web" } }` |
| Redis auth errors on Render | `REDIS_URL` must be `rediss://default:<PASSWORD>@...` (Upstash TLS URL), not the plain HTTPS REST URL |
| CORS errors in browser console | `CORS_ORIGINS` on Render must exactly match `https://auto-mart-web.vercel.app` |
| Old env still active after change | `NEXT_PUBLIC_*` needs a fresh build; Render needs "Clear build cache & deploy" |
| Google login fails in popup | JS origin missing in Google Console (Part 3.3); also allow `http://localhost:3000` |
| Payments webhook returns 400 | `STRIPE_WEBHOOK_SECRET` mismatch or endpoint URL wrong — recreate the webhook endpoint |
| Turnstile not showing on forms | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` empty → widget intentionally renders nothing (feature-safe); set both keys to enable |

---

## Secret hygiene

- `.env.docker` is **gitignored** — don't commit it.
- This file intentionally uses placeholders for credentials (`JWT_SECRET`, Stripe, webhook, Redis password) — source them from `.env.docker` or the dashboards.
- `GOOGLE_CLIENT_ID`, Supabase URL/anon key, and the Stripe **test** key are safe to share (browser-visible by design / test-only).
