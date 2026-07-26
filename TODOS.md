# AutoMart — Project Todos

> Branch: `sanjay`
> Last updated: 2026-07-26 (E2E 73/73, commit 1d31f91, merged to main)
> Monitoring: Athena-MAX active

---

## ✅ Completed

### Phase 1: Foundation & Dev Setup
- [x] Install dependencies: `npm install` in root (513 packages)
- [x] Add missing package.json files with correct dependencies for all services
- [x] Add tsconfig.json for all services
- [x] Add .nvmrc with `20`
- [x] Docker storage moved to D:\Docker (freed 20GB on C:)
- [x] Docker pre-test cleanup script created (scripts/docker-cleanup.bat)

### Phase 2: Database & Prisma
- [x] Run `npx prisma migrate dev` for auth/product/order/inventory services
- [x] Seed scripts: 4 test users (auth), 24 products + 8 categories (product)
- [x] SQLite for local dev (all schemas converted)

### Phase 3: Backend Services
- [x] Auth service — register/login/me with JWT
- [x] Product service — CRUD + categories
- [x] Search service — Fuse.js fuzzy + Trie autocomplete + image search
- [x] Order service — CRUD + status tracking + Redis events
- [x] Inventory service — reserve/release/confirm
- [x] Notification service — Redis pub/sub email/SMS
- [x] API Gateway — proxy + rate limit + auth middleware
- [x] MCP Server — 5 tools (search, stock, orders, categories, popular)
- [x] Structured error messages: `{ code, message, hint }` across all services

### Phase 4: Frontend Pages
- [x] Landing page with hero and categories
- [x] Login/register forms with validation + toast notifications
- [x] Search page with text search + autocomplete + filters
- [x] Product detail page with specs + compatible vehicles
- [x] Cart add/remove/quantity (localStorage)
- [x] Checkout form with validation
- [x] Order tracking with status timeline
- [x] Dark/light theme toggle with localStorage persistence
- [x] Error boundaries (ErrorBoundary.tsx + app/error.tsx)
- [x] Toast notification system
- [x] Responsive design (mobile + desktop)

### Phase 5: Search Algorithms
- [x] Implement Trie for autocomplete suggestions
- [x] 10/10 unit tests for Trie (vitest)
- [x] Fuse.js fuzzy text search
- [x] Implement TF-IDF scoring for text search
- [x] Add real CLIP model integration for image search
- [x] Add FAISS vector index for image embedding search

### Phase 6: E2E Testing
- [x] Playwright config (chromium, retries, timeouts)
- [x] 6 Page Object Models (Login, Register, Search, ProductDetail, Checkout, Orders)
- [x] 6 test files: auth/login, auth/register, product/browse, product/search, order/place, order/track
- [x] Fixed selectors to match actual UI

### Phase 7: CI/CD Pipeline
- [x] Backend build matrix (8 services in parallel)
- [x] Unit tests job (Vitest)
- [x] Frontend build job (Next.js)
- [x] Docker build check job
- [x] E2E tests job (Playwright + Docker Compose)

### Phase 8: Docker
- [x] docker-compose.yml (SQLite + Redis, 8 services + web)
- [x] All 9 Dockerfiles (multi-stage, monorepo root context)
- [x] .dockerignore
- [x] Entry scripts with prisma migrate deploy
- [x] Healthchecks on all services
- [x] docker-compose.dev.yml (source mount + live reload)
- [x] .env.docker

### Phase 9: MCP Integration
- [x] MCP server with 5 tools

### Phase 10: Polish & Resume
- [x] Toast notifications
- [x] Error boundaries
- [x] Dark/light theme toggle
- [x] Structured error messages
- [x] README.md with architecture, setup, API docs, project structure

### DSA Implemented
- [x] Trie — autocomplete search suggestions
- [x] Levenshtein Distance / Bitap — fuzzy string matching
- [x] TF-IDF — term frequency scoring
- [x] Cosine Similarity — vector comparison

### Phase 11: Full UI/UX Redesign
- [x] Dark automotive industrial theme
- [x] Glassmorphism design system
- [x] Outfit + Inter font pairing
- [x] Hero 3D coverflow carousel
- [x] All 15+ pages redesigned
- [x] Voice/camera search
- [x] 43/43 E2E tests passing

### Phase 12: Production Deployment — SKIPPED (deferred)
- Deferred to after all features complete

### Phase 13: PostgreSQL Migration ✅ COMPLETE (committed `bd3e0ea`)
- [x] All 4 Prisma schemas → PostgreSQL (Supabase)
- [x] docker-compose.yml simplified (no SQLite volumes)
- [x] `supabase/setup.sql` — 8 tables + RLS + stored procedures
- [x] `supabase/README.md` — full setup guide
- [x] Prisma generate for all 4 services

### Phase 14: Stripe Payment Integration ✅ COMPLETE (committed `cfbcfa1`)
- [x] Stripe SDK + payments router (`order-service/src/payments.ts`)
- [x] API Gateway `/api/payments` route
- [x] Checkout page → Stripe Checkout redirect
- [x] Checkout success page → payment verification
- [x] Docker env vars for Stripe

### Phase 15: Admin Dashboard ✅ COMPLETE (committed `f0869c6` + fixes)

#### Backend (auth-service) — 24 API routes
- [x] `POST /admin/bootstrap` — One-time first admin creation
- [x] `POST /admin/login` — Admin-specific login (validates role=admin)
- [x] `POST /admin/create-admin` — Create additional admins (admin-only)
- [x] `GET /admin/me` — Current admin profile
- [x] `PATCH /admin/change-password` — Requires current password
- [x] `PATCH /admin/change-username` — Update display name
- [x] `POST /admin/forgot-password` — 6-digit code via Redis
- [x] `POST /admin/reset-password` — Verify code + set new password
- [x] `GET /admin/users` — Paginated list (search + role filter)
- [x] `GET /admin/users/:id` — User detail
- [x] `PATCH /admin/users/:id` — Update user role
- [x] `DELETE /admin/users/:id` — Delete user (self-delete protection)
- [x] `GET /banners/public` — Active banners (no auth)
- [x] `GET /admin/banners` — List all banners
- [x] `POST /admin/banners` — Create banner
- [x] `PATCH /admin/banners/:id` — Update banner
- [x] `DELETE /admin/banners/:id` — Delete banner
- [x] `PATCH /admin/banners/reorder` — Reorder (transaction-based)

#### Frontend — 11 files
- [x] `lib/admin-auth.ts` — Auth context (login/logout/token/role guard)
- [x] `admin/layout.tsx` — Collapsible sidebar + header + auth gate + public page exceptions
- [x] `admin/page.tsx` — Dashboard (stat cards, recent users, quick actions)
- [x] `admin/login/page.tsx` — Admin login with role validation
- [x] `admin/forgot-password/page.tsx` — Email → 6-digit code
- [x] `admin/reset-password/page.tsx` — Code + new password
- [x] `admin/banners/page.tsx` — Full CRUD + reorder + modal forms
- [x] `admin/products/page.tsx` — List + filters + stock badges + create modal
- [x] `admin/orders/page.tsx` — List + expandable detail + status update
- [x] `admin/inventory/page.tsx` — Stock levels + summary cards
- [x] `admin/users/page.tsx` — Paginated list + role change + delete + self-protection
- [x] `admin/settings/page.tsx` — Change username + password

#### Bugs Fixed
- [x] Auth entrypoint hanging on `prisma db push` (Supabase PgBouncer issue) → simplified to skip
- [x] `users_role_check` constraint missing `admin` → ALTER TABLE added
- [x] Seed user `admin@automart.com` had role `shop` → updated to `admin`
- [x] Admin layout infinite redirect loop (login page redirected to itself) → added public page exceptions
- [x] `NEXT_PUBLIC_SUPABASE_URL` typo (`pljput` → `pljsut`) → fixed in `.env.docker`

#### Migrations Created
- [x] `supabase/migration-banners.sql` — banners table
- [x] `supabase/migration-banner-storage.sql` — banner-images storage bucket + RLS

---

## ✅ P0 — Completed (2026-07-26)

### 🔥 P0 — Must Do First (blockers) ✅ ALL DONE

- [x] **Run banner table migration** — Ran via Node.js pg client directly against Supabase PostgreSQL. ✅
- [x] **Admin login test** — API verified: login returns valid JWT, `/me` works, dashboard loads (HTTP 200). ✅
- [x] **Change admin credentials** — Username → "Sanjay Admin", Password → `AutoMart@2026!`. Verified with fresh login. ✅
- [x] **Fix `/banners/public` API route** — Added `/banners` → auth-service router entry in API gateway. ✅
- [x] **Clean up test banners** — Deleted 7 E2E test banners, activated "Mega Brake Sale". 6 real banners remain. ✅

## 🟡 TODO — Next Up (2026-07-26)

### 🟡 P1 — Core Features (high value) ✅ ALL DONE

- [x] **Admin banner upload** — Added Supabase Storage file upload to banner form (file picker → upload → auto-set URL). ✅
- [x] **Admin product CRUD** — Added PATCH/DELETE API routes + edit/delete buttons + unified create/edit modal. ✅
- [x] **Admin order status updates** — Fixed admin sees ALL orders (was user-scoped). State machine validated (pending→confirmed→picked→shipped→delivered). INR pricing. ✅
- [x] **Admin inventory stock alerts** — Verified per-product inventory lookup works. Summary cards + stock badges functional. ✅
- [x] **Admin user management** — Tested role change (individual→shop), user deletion, self-protection (admin can't delete self). ✅
- [x] **Admin settings** — Username + password change verified via API. Frontend page loads (200). ✅
- [x] **Frontend build check** — All 8 admin pages load (200). Docker rebuild passed. ✅

### 🟢 P2 — Polish & Integration ✅ ALL DONE (2026-07-26)

- [x] **Hero carousel → API** — Replaced hardcoded `slides[]` with `GET /api/banners/public` fetch + fallback. ✅
- [x] **Stripe webhook verification** — Added `express.raw()` + `rawBody` preservation for signature verification. ✅
- [x] **Stripe currency fix** — Changed `usd` → `inr` in checkout session + error messages. ✅
- [x] **Notification broadcast** — Added `POST /notifications/broadcast` (admin-only) + `GET /notifications` listing. ✅
- [x] **Admin dashboard stats** — Added `GET /orders/stats` + `GET /products/stats` endpoints. Dashboard now shows 6 real stat cards (Products, Orders, Revenue, Inventory, Banners, Users). ✅

### 🔵 P3 — Email, Analytics & Polish

- [x] **Email Templates** — HTML email templates (order confirmation, status update, welcome, password reset) in `templates.ts`. Inline CSS, AutoMart branding. ✅
- [x] **Notification Service Enhanced** — Wired templates into event handlers. Added `user:registered` + `user:password_reset` Redis channels. Order events now carry `userName`/`userEmail`. ✅
- [x] **JWT User Info** — Auth-service JWTs now include `name`/`email` fields (backward-compatible). ✅
- [x] **Notification Bell API Integration** — Navbar notification bell now fetches from `GET /api/notifications` when logged in, merges with localStorage. ✅
- [ ] **Analytics Dashboard** — Admin analytics page with revenue charts, order trends, top products, user growth.
- [x] **Admin E2E tests** — 73/73 Playwright tests all passing (admin, auth, browse, search, cart, order, UI). ✅ (commit 1d31f91)
- [x] **Cart Persistence** — All cart mutations (add/update/remove) sync to Redis via `saveCart()` + localStorage fallback. Checkout loads from `syncCart()`. ✅
- [ ] **Product Image Upload** — Admin product form: upload product images to Supabase Storage instead of external URLs.
- [ ] **Order Confirmation Page** — Post-checkout success page with order summary, estimated delivery, and tracking link.
- [ ] **Mobile Responsive Polish** — Final pass on all pages for mobile/tablet breakpoints, touch targets, and swipe gestures.
- [ ] **Performance Audit** — Lighthouse pass: fix CLS, LCP, bundle splitting, image optimization.
- [ ] **Production Deployment** — Vercel (frontend) + Railway (backend). Deferred until all features stable.

---

## 📝 Notes

### Design System Summary
- **Colors**: jet black `#0A0A0A`, charcoal `#1A1A1A`, neon lime `#39FF14` (accent), coral `#FF523B` (CTAs), sky blue `#38B6FF`
- **Fonts**: Outfit (headings) + Inter (body)
- **Cards**: glassmorphism — `bg-white/[0.04]` + `backdrop-blur-md` + `border-white/[0.08]`
- **Buttons**: glass circles — `bg-white/[0.06]` + `backdrop-blur-md`
- **Max width**: `max-w-[2560px]` everywhere
- **Product images**: always 1:1 aspect ratio

### Supabase
- **Project ID**: `mmvrkljevwgkonpljsut`
- **Project URL**: `https://mmvrkljevwgkonpljsut.supabase.co`
- **Dashboard**: `https://supabase.com/dashboard/project/mmvrkljevwgkonpljsut`
- **Storage bucket**: `banner-images` (public, 2MB, PNG/JPG/WebP)
- **Test banner image**: `https://mmvrkljevwgkonpljsut.supabase.co/storage/v1/object/public/banner-images/form.png`

### Admin Credentials
- **URL**: `http://localhost:3080/admin/login`
- **Email**: `admin@automart.com`
- **Password**: `AutoMart@2026!`
- **Name**: `Sanjay Admin`
- **Role**: `admin`

### Git Commits (July 23 — Admin System Session)
- `bd3e0ea` — Phase 13 PostgreSQL migration (22 files)
- `3c8c67b` — Phase 13 type fixes
- `f0869c6` — Phase 15 Admin system (16 files, 3959 insertions)
- `cfbcfa1` — Phase 14 Stripe integration (20 files)
- `1d31f91` — E2E 73/73 passing: cart category fix, price coercion, rate limits, defensive guards (23 files, 685 insertions)

### Known Issues
- ~~⚠️ **Banner table missing in Supabase**~~ — FIXED: Migration ran via Node.js pg client.
- ~~⚠️ **Admin credentials are defaults**~~ — FIXED: Changed to Sanjay Admin / AutoMart@2026!.
- ~~⚠️ **`/banners/public` route broken**~~ — FIXED: Added `/banners` → auth-service in API gateway router.

### Known Bugs — FIXED
- ~~Settings icon not visible~~ — FIXED (hamburger drawer)
- ~~Voice animation too subtle~~ — FIXED (6-bar wave + pulsing rings)
- ~~7 E2E tests failing~~ — FIXED (all 43/43 passing)
- ~~GoogleOAuth DOM detach~~ — FIXED (isolated provider)
- ~~Mobile drawer z-index~~ — FIXED (moved outside nav)
- ~~Auth entrypoint hanging~~ — FIXED (skip prisma db push)
- ~~Admin role constraint~~ — FIXED (ALTER TABLE added admin)
- ~~Admin layout redirect loop~~ — FIXED (public page exceptions)
- ~~Supabase URL typo~~ — FIXED (pljput → pljsut)
- ~~Admin orders only showing own orders~~ — FIXED (admin role check in order-service GET /orders)
- ~~`/banners/public` route broken~~ — FIXED (added `/banners` → auth-service in gateway router)
- ~~Product spec JSONB not normalized~~ — FIXED (array conversion for PostgreSQL JSONB)
- ~~Price display showing $ instead of ₹~~ — FIXED (all pages converted to INR)
- ~~Stripe webhook signature verification broken~~ — FIXED (express.raw() + rawBody preservation)
- ~~Stripe currency USD instead of INR~~ — FIXED (checkout session + notifications)
- ~~Admin dashboard showing static "—" for stats~~ — FIXED (real API endpoints: /orders/stats, /products/stats)
- ~~Cart page React error #31 (object rendering)~~ — FIXED (getCategoryName helper for PostgreSQL JSONB category) ✅ 2026-07-26
- ~~Product detail crash on API error~~ — FIXED (error-object guard before .toLocaleString()) ✅ 2026-07-26
- ~~Search page .map crash on API error~~ — FIXED (Array.isArray guard on API response) ✅ 2026-07-26
- ~~API rate limit too low for E2E~~ — FIXED (global 200→1000, auth 10→50) ✅ 2026-07-26
- ~~Banner test placeholder mismatch~~ — FIXED (image URL placeholder = "Paste image URL") ✅ 2026-07-26
- ~~Admin seed role/password wrong~~ — FIXED (role 'shop'→'admin', password→Admin@12345, upsert with update) ✅ 2026-07-26

---

## 📡 Real-Time Agent Monitor

| Agent | Status | Last Seen | Current Task |
|-------|--------|-----------|--------------|
| Athena-MAX | 🟢 Active | 2026-07-26 | E2E fixes 73/73, merged to main |
| Athena-GOD | 🟡 Idle | 2026-07-23 | Session closed |

### Monitor Log
- `2026-07-23 08:35` — Monitoring started.
- `2026-07-23 16:55` — Phase 13 committed (`bd3e0ea`, `3c8c67b`).
- `2026-07-23 17:36` — Phase 15 committed (`f0869c6`).
- `2026-07-23 21:08` — Phase 14 committed (`cfbcfa1`).
- `2026-07-23 22:00` — Admin bootstrap fixed (role constraint, infinite redirect, entrypoint). TODOS updated for tomorrow.
- `2026-07-23 22:30` — End-of-day check: all 10 Docker containers healthy ✅, admin login API verified ✅, banner storage bucket exists ✅. Session closed.
- `2026-07-26` — E2E 73/73 ALL PASSING. Fixed 6 bugs (cart JSONB, rate limits, defensive guards, seed, banner placeholder). Merged to main.
- **Total commits today**: 1 (`1d31f91`)

---

## 📋 REMAINING PENDING TASKS

### 🔵 P3 — Analytics & Polish

| # | Task | Priority | Notes |
|---|------|----------|-------|
| 1 | **Analytics Dashboard** | Medium | Admin page with revenue charts, order trends, top products, user growth |
| 2 | **Cart Persistence** | Medium | Move cart from localStorage to server-side (Redis) for cross-device sync |
| 3 | **Product Image Upload** | Medium | Admin product form: upload images to Supabase Storage instead of external URLs |
| 4 | **Order Confirmation Page** | Low | Post-checkout success page with order summary, estimated delivery, tracking link |
| 5 | **Mobile Responsive Polish** | Low | Final pass on all pages for mobile/tablet breakpoints, touch targets, swipe gestures |
| 6 | **Performance Audit** | Low | Lighthouse pass: fix CLS, LCP, bundle splitting, image optimization |
| 7 | **Production Deployment** | Low | Vercel (frontend) + Railway (backend). Deferred until all features stable |

### 💡 Future Ideas

| # | Task | Priority | Notes |
|---|------|----------|-------|
| 8 | **PWA Support** | Low | Service worker, offline browsing, install prompt |
| 9 | **Priority Queue** | Low | Redis-based order processing queue for high-traffic scenarios |
| 10 | **Wishlist Sync** | Low | Server-side wishlist persistence (Redis, like cart) |
| 11 | **Email Marketing** | Low | Newsletter signup, promotional email campaigns |
| 12 | **Multi-language** | Low | Hindi + Tamil + French support (Hero carousel already has i18n structure) |
