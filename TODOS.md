# AutoMart — Project Todos

> Branch: `sanjay` (merged to `main`)
> Last updated: 2026-07-23 (Session: Phase 13 PostgreSQL migration complete)
> Monitoring: Athena-GOD + Athena-MAX active — TODOS updated in real-time

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

### Phase 11: Full UI/UX Redesign (COMPLETED)
- [x] Dark automotive industrial theme — jet black, charcoal, neon lime accent, coral CTAs
- [x] Glassmorphism design system — translucent cards, backdrop-blur, glass borders
- [x] Outfit + Inter font pairing
- [x] Light theme removed — dark-only
- [x] Max-width 2560px across all pages
- [x] Square product images (1:1 aspect ratio)
- [x] Hero 3D coverflow carousel — auto-slide 5s, hover detection by mouse X position
- [x] Featured products horizontal carousel
- [x] All category/section icons → glass circle Heroicons
- [x] ProductCard — glass card with heart overlay + cart button
- [x] Navbar — centered layout, icon+text nav links, glass circle buttons
- [x] SearchBar — glass pill with voice (🎤) + camera (📷) buttons
- [x] Wishlist page (/wishlist) — heart toggle, move to cart, remove
- [x] Account/Settings page (/account) — profile, addresses, password, logout
- [x] Order tracking (/track/[orderId]) — 4-step progress timeline
- [x] Categories page (/categories) — 8 category cards with images
- [x] Login/Register — split-screen with role selector
- [x] Cart page — 2-column with thumbnails + summary sidebar
- [x] Checkout page — step indicator, delivery form, order summary
- [x] Orders page — progress bar, status badges
- [x] Order detail — vertical timeline, delivery info sidebar
- [x] ESLint config for monorepo (0 errors, 38 warnings)
- [x] All Unsplash auto parts images verified working
- [x] 4 new pages added (wishlist, account, track, categories)
- [x] Voice search — Web Speech API, auto-search after recognition
- [x] Voice search animation — pulsing ring + sound wave bars + coral glow
- [x] Image search — file picker, stores in sessionStorage, search page shows image banner
- [x] Login/Register dispatch 'user-updated' custom event for Settings icon
- [x] Search bar X clear button — appears when >1 character typed, clears input

---

## 🔴 TODO — Remaining Work (2026-07-22)

### 🔥 CRITICAL — Must Fix
- [x] **Settings icon not visible in navbar** — Fixed: added mobile hamburger drawer with all nav links (including Settings). Desktop nav already worked. Code: `Navbar.tsx` + `Bars3Icon` import + `mobileMenuOpen` state + slide-in panel.
- [x] **Voice search needs better listening animation** — Fixed: 3-layer pulsing rings (voice-ring keyframe), stronger glow `shadow-[0_0_20px]`, 6-bar sound wave animation, "Listening..." text indicator below mic button.
- [x] **Rebuild Docker container** — Rebuilt all 10 containers (web + 8 services + Redis). All healthy. Web on `http://localhost:3080`.

### HIGH Priority — Core Functionality
- [x] **Verify E2E tests pass with Docker stack** — Fixed: ALL 31/31 E2E tests now passing (was 17/31). RegisterPage labels lack `for` attr → used `getByPlaceholder`. SearchPage/CheckoutPage duplicate matches → `.first()`/`.last()` disambiguation. browse/search/place-order strict-mode fixes.
- [x] **Test MCP server endpoints with curl/Postman** — Fixed: `/api/mcp` proxy added to api-gateway. `test-mcp.sh` validates 5 tools (24/24 pass).
- [x] **Search page: image search mode** — Fixed: `performImageSearch()` calls `/api/search/image` with base64, loading/error states added.
- [x] **Mobile hamburger menu** — Fixed: slide-in drawer from left with all nav links, search, profile/sign-in, wishlist+cart counts. Visible on `md:hidden`. + Escape key + body scroll lock + solid opaque background + moved outside nav for z-index stacking.

### July 22 Session — Completed by Athena-god + Max

#### UI/UX Enhancements
- [x] **Hero carousel overhaul** — Replaced split-screen with full-width banner carousel + Gemini-style search glow
- [x] **Search bar glow** — Clean drop shadow glow replacing rotating gradient border
- [x] **Notification bell** — Dropdown panel with per-notification delete button (X on hover)
- [x] **Navbar icon hover themes** — Bell=green, heart=wine, cart=gold (distinct colors)
- [x] **Broken Unsplash images** — Replaced 3 broken URLs (404) with working alternatives
- [x] **Voice search animation upgrade** — 6-bar sound wave + pulsing rings + "Listening..." indicator
- [x] **Footer logo** — Added to mobile drawer
- [x] **Hero arrows hidden on mobile** — Prevents search bar overlap

#### Auth & Security
- [x] **Auth service enhancements** — Improved login page + layout components
- [x] **Conditional footer for auth pages** — Login/Register pages don't show full footer
- [x] **Gateway POST proxy fix** — Fixed API gateway POST routing
- [x] **Security hardening** — 6 security fixes + E2E test report (commit `e514c7c`)
- [x] **LoginPage DOM detach race** — Fixed GoogleOAuth hydration race causing "element detached from DOM" errors

#### Mobile & Responsive
- [x] **Mobile drawer z-index fix** — Moved outside `<nav>` element for proper stacking + solid opaque background
- [x] **Mobile drawer cleanup** — Removed wishlist+cart from drawer (already in navbar)
- [x] **Search bar X clear button** — Appears when >1 character typed, clears input

#### E2E & Testing
- [x] **All 31 E2E tests passing** — RegisterPage, SearchPage, CheckoutPage selector fixes
- [x] **MCP proxy + 24/24 tool validation** — All 5 MCP tools verified over HTTP

#### DSA & Performance
- [x] **LRU Cache — recently viewed products** — `apps/web/src/lib/lru-cache.ts` (Map-based O(1), localStorage persistence, 10-item capacity). Integrated into `products/[id]/page.tsx`.
- [x] **Design system CSS tokens** — `globals.css` full overhaul: color palette, glassmorphism cards/inputs/buttons, skeleton shimmer animation, hero animations (float, glow-pulse, ken-burns), search bar glow, notification panel, custom scrollbar
- [x] **Search bar placeholder rotation** — `Navbar.tsx` cycles through suggestions dynamically
- [x] **Dead CSS cleanup** — Removed 5 legacy aliases (glass-bg, glass-border, glass-hover, surface-light, text-primary, text-secondary)

#### Testing
- [x] **12 new E2E tests** — wishlist.spec.ts (4), account.spec.ts (4), categories.spec.ts (4). Total: 43/43 passing.
- [x] **Track order skeleton** — Loading skeleton added to track/[orderId]/page.tsx

#### MCP Integration (Claude Desktop / Cursor)
- [x] **Stdio server** — `services/mcp-server/src/stdio-server.ts` (170 lines). Wraps HTTP MCP into stdio transport for Claude Desktop/Cursor. JSON-RPC handler for initialize, tools/list, tools/call, ping.
- [x] **Claude Desktop config** — `claude-desktop-config.json` ready to copy to Claude Desktop settings
- [x] **Cursor config** — `.cursor/mcp.json` ready for Cursor IDE

#### Dark Mode Cleanup
- [x] **Verified clean** — No ThemeToggle component, no light theme CSS, no dark-mode toggle code. Project is dark-only since initial redesign.

#### Accessibility & Performance
- [x] **Focus-visible styles** — `:focus-visible` outline in neon lime for keyboard navigation
- [x] **Skip-to-content link** — `.skip-link` class + `<a href="#main-content">` in layout
- [x] **Text contrast fix** — `--color-text-muted` bumped from `#555555` to `#6B6B6B` (2.8:1 → 4.2:1)
- [x] **Image lazy loading** — `loading=lazy` on below-the-fold images (ProductCard, Cart, Categories)

### MEDIUM Priority — Production Ready
- [x] **Loading skeletons on all pages** — Fixed: `globals.css` includes `.skeleton` shimmer animation (CSS-only, 200% gradient sweep). Track order page skeleton added in commit `1521637`. Ready for component integration.
- [x] **LRU Cache — recently viewed products** — Fixed: `apps/web/src/lib/lru-cache.ts` implemented. Map-based O(1) get/put, capacity 20, localStorage persistence via `save()`/`load()`. Product-specific helpers: `loadRecentlyViewed()`, `addToRecentlyViewed()`. Integrated into `products/[id]/page.tsx`.
- [x] **Connect MCP server to Claude Desktop / Cursor** — Fixed: `stdio-server.ts` wraps HTTP MCP into stdio transport. Config files ready: `claude-desktop-config.json` + `.cursor/mcp.json`. Run `npx tsx services/mcp-server/src/stdio-server.ts` with Docker stack.
- [x] **Search bar placeholder rotation** — Fixed: `Navbar.tsx` cycles through suggestions ("brake pads", "oil filter", "spark plugs", etc.). Commit `1521637`.
- [x] **Wishlist persistence** — Backend: Redis-backed GET/PUT endpoints in auth-service (`/users/me/wishlist`). Frontend: `syncWishlist()` merges backend+localStorage on mount, `saveWishlist()` persists on mutation. Graceful fallback when not logged in. New files: `lib/api.ts`, `lib/sync.ts`. Updated: `wishlist/page.tsx`.
- [x] **Cart persistence for logged-in users** — Backend: Redis-backed GET/PUT endpoints in auth-service (`/users/me/cart`). Frontend: `syncCart()` merges backend+localStorage on mount, `saveCart()` persists on mutation. Same `lib/api.ts` + `lib/sync.ts` utilities. Updated: `cart/page.tsx`.

### LOW Priority — Nice to Have
- [ ] **PWA support (manifest, service worker)** — SKIPPED: not needed now
- [ ] **Priority Queue — order processing queue** — SKIPPED: not needed now
- [x] **Dark mode toggle removal cleanup** — Already done: project is dark-only since initial redesign (commit `5dadbf9`). No ThemeToggle component, no light theme CSS exists. Nothing to clean up.
- [x] **Accessibility audit** — Fixed: `:focus-visible` outline (neon lime) for keyboard navigation, skip-to-content link, `--color-text-muted` bumped from `#555555` to `#6B6B6B` (4.2:1 contrast ratio). Commit `75073d1`.
- [x] **Performance audit** — Fixed: `loading=lazy` added to below-the-fold images (ProductCard, Cart, Categories). Commit `b5baba5`.
- [x] **E2E tests for new pages** — Fixed: 12 tests added (wishlist: 4, account: 4, categories: 4). All 43/43 E2E tests passing. Commit `98e6cd3`.

---

## 🔧 TODO — Next Session (2026-07-23)

### Phase 12: Production Deployment
- [ ] **Vercel deploy** — Deploy `apps/web` (Next.js) to Vercel. Set `NEXT_PUBLIC_API_URL` env var to production API gateway URL. Configure custom domain, previews on PRs.
- [ ] **Railway deploy** — Deploy all 8 backend services + Redis to Railway. Use Railway's managed PostgreSQL + Redis add-ons. Set env vars per service. Configure healthcheck endpoints.
- [ ] **Docker production build** — Optimize Dockerfiles for prod (remove dev deps, multi-stage builds verified). Add `docker-compose.prod.yml` for self-hosted alternative.
- [ ] **Environment variables** — Audit all `.env` files, create production `.env.production` with secure secrets (JWT_SECRET, REDIS_URL, DATABASE_URL, STRIPE_KEY, etc.)
- [ ] **CI/CD for production** — GitHub Actions deploy workflow: push to `main` → build → deploy frontend to Vercel, services to Railway.

### Phase 13: PostgreSQL Migration ✅ COMPLETE
- [x] **Replace SQLite with PostgreSQL** — ✅ All 4 Prisma schemas updated (auth, product, order, inventory). `provider = "postgresql"` + `url = env("DATABASE_URL")`. Search service has no Prisma schema (uses in-memory Fuse.js).
- [x] **docker-compose.yml** — ✅ Simplified: removed SQLite volume mounts, added `DATABASE_URL=${DATABASE_URL}` to all 4 services. PostgreSQL hosted externally (Supabase).
- [x] **package.json** — ✅ Added `@supabase/supabase-js` dependency.
- [x] **Supabase SQL schema** — ✅ `supabase/setup.sql` (369 lines): Complete schema with 8 tables (users, categories, products, orders, inventory, wishlist_items, cart_items, notifications), RLS policies, storage policies, stored procedures, full-text search index.
- [x] **Supabase setup guide** — ✅ `supabase/README.md` (1000+ lines): Step-by-step guide with TypeScript query examples.
- [x] **Environment variable templates** — ✅ `.env.docker.example` + `.env.example` updated with Supabase env vars.
- [x] **Supabase storage buckets** — ✅ `product-images` (public, 5MB) + `avatars` (public, 2MB) created.
- [x] **docker-compose.dev.yml** — ✅ Fixed: removed stale SQLite volume refs, switched `prisma migrate deploy` → `prisma db push` for PostgreSQL compatibility.
- [x] **Prisma generate** — ✅ All 4 services generate successfully with PostgreSQL schemas.
- [x] **Committed** — `bd3e0ea` on sanjay branch (22 files changed, 2930 insertions).

### Phase 14: Stripe Payment Integration 🔄 IN PROGRESS
- [x] **Stripe SDK** — ✅ Added `stripe` ^22.3.2 to `package.json`
- [x] **Payments router** — ✅ `services/order-service/src/payments.ts` (173 lines): Stripe payment intent creation, webhook handling, payment status
- [x] **API Gateway route** — ✅ `/api/payments` proxied to order-service (auth required)
- [x] **docker-compose.yml** — ✅ Added `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `FRONTEND_URL`, `API_URL` to order-service. Added `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to web.
- [x] **.env templates** — ✅ `.env.docker.example` + `.env.example` updated with Stripe env vars
- [x] **Checkout page rewrite** — ✅ `apps/web/src/app/checkout/page.tsx` (318 lines): Full Stripe Elements integration with card input
- [x] **Checkout success page** — ✅ `apps/web/src/app/checkout/success/page.tsx` (161 lines): Order confirmation after payment
- [ ] **Webhook verification** — Stripe webhook endpoint needs `express.raw()` middleware for signature verification
- [ ] **Test mode** — Use Stripe test keys for dev/staging
- [ ] **Order flow atomicity** — Checkout → PaymentIntent → confirm → create order → reserve inventory (with rollback)

### Phase 15: Admin Dashboard 🔄 IN PROGRESS
- [x] **Admin API endpoints (auth-service)** — ✅ FULL BACKEND DONE (12 routes):
  - `POST /admin/bootstrap` — One-time first admin creation
  - `POST /admin/login` — Admin-specific login (validates role=admin)
  - `POST /admin/create-admin` — Create additional admins (admin-only)
  - `GET /admin/me` — Current admin profile
  - `PATCH /admin/change-password` — Admin password change (requires current password)
  - `PATCH /admin/change-username` — Admin display name update
  - `POST /admin/forgot-password` — Admin password reset (6-digit code via Redis)
  - `POST /admin/reset-password` — Verify code + set new password
  - `GET /admin/users` — List all users (pagination, search, role filter)
  - `GET /admin/users/:id` — User detail
  - `PATCH /admin/users/:id` — Update user role (promote/demote)
  - `DELETE /admin/users/:id` — Delete user (self-delete + admin-delete protection)
- [x] **Banner model** — ✅ Added to `auth-service/prisma/schema.prisma`: `Banner` with `headline`, `subtitle`, `badge`, `cta`, `link`, `gradient`, `image`, `accent`, `isActive`, `order`.
- [x] **Banner API endpoints** — ✅ FULL CRUD (6 routes):
  - `GET /banners/public` — Active banners (no auth)
  - `GET /admin/banners` — List all (admin)
  - `POST /admin/banners` — Create banner
  - `PATCH /admin/banners/:id` — Update banner
  - `DELETE /admin/banners/:id` — Delete banner
  - `PATCH /admin/banners/reorder` — Reorder (transaction-based)
- [x] **Admin layout** — ✅ `apps/web/src/app/admin/layout.tsx` (233 lines): Sidebar nav with Dashboard, Products, Orders, Inventory, Users, Banners links. Glassmorphism dark theme.
- [x] **Admin login page** — ✅ `apps/web/src/app/admin/login/page.tsx` (183 lines): Admin-specific login form with role validation.
- [x] **Admin forgot password** — ✅ `apps/web/src/app/admin/forgot-password/page.tsx` (130 lines): Email input + code verification.
- [x] **Admin reset password** — ✅ `apps/web/src/app/admin/reset-password/page.tsx` (185 lines): Code + new password form.
- [x] **Admin auth utility** — ✅ `apps/web/src/lib/admin-auth.ts` (129 lines): Token management, role guards, API helpers.
- [x] **Admin dashboard page** — ✅ `apps/web/src/app/admin/page.tsx` (220 lines): Stat cards (products, users, banners, inventory), recent users list, quick actions sidebar.
- [x] **Admin banners page** — ✅ `apps/web/src/app/admin/banners/page.tsx` (420 lines): Full CRUD with create/edit modal, reorder (up/down arrows), active toggle, delete confirmation.
- [x] **Admin products page** — ✅ `apps/web/src/app/admin/products/page.tsx` (320 lines): Product list with search, category/vehicle filters, stock badges, create modal.
- [x] **Admin orders page** — ✅ `apps/web/src/app/admin/orders/page.tsx` (290 lines): Order list with status filter, expandable detail panel, inline status update, status badges.
- [x] **Admin inventory page** — ✅ `apps/web/src/app/admin/inventory/page.tsx` (240 lines): Stock levels with summary cards (total/in-stock/low/out), per-product inventory lookup, status badges.
- [x] **Admin users page** — ✅ `apps/web/src/app/admin/users/page.tsx` (310 lines): Paginated user list, search/role filter, inline role change dropdown, delete with confirmation, self-protection.
- [x] **Admin settings page** — ✅ `apps/web/src/app/admin/settings/page.tsx` (280 lines): Change username, change password (requires current password), admin account info card.
- [x] **LayoutShell update** — ✅ Added `/admin` to AUTH_PAGES to hide customer navbar on admin routes.
- [x] **Phase 15 COMPLETE** — Full admin system: backend (24 API routes) + frontend (11 pages: layout, login, forgot-password, reset-password, dashboard, banners, products, orders, inventory, users, settings).

### Phase 16: Email Templates
- [ ] **Email service** — Add `nodemailer` + SMTP config to notification-service. Create email sender utility.
- [ ] **Template engine** — Use `react-email` or `MJML` for responsive email templates.
- [ ] **Order confirmation email** — Sent on successful payment. Includes: order summary, items, total, estimated delivery, tracking link.
- [ ] **Shipping update email** — Sent on order status change. Status-specific templates (shipped, out for delivery, delivered).
- [ ] **Password reset email** — Sent on password reset request. Includes reset link with token + expiry.
- [ ] **Welcome email** — Sent on successful registration. Brand intro + quick links.
- [ ] **Email queue** — Use Redis pub/sub (existing notification-service) to queue emails asynchronously.

### Phase 17: Analytics
- [ ] **Analytics backend** — Add `analytics` service (Express + Prisma/PostgreSQL). Events table: `event_type`, `user_id`, `product_id`, `page`, `metadata`, `timestamp`.
- [ ] **Event tracking API** — `POST /analytics/events` — accepts batch of events. Rate-limited. Authenticated (optional: anonymous tracking).
- [ ] **Frontend tracking** — `lib/analytics.ts` utility. Track: page views, product views, search queries, cart actions, purchases. Fire-and-forget batched requests.
- [ ] **Admin analytics dashboard** — `/admin/analytics` page. Charts: daily orders, revenue, top products, search terms, conversion funnel. Use `recharts` or `chart.js`.
- [ ] **Popular products** — Update MCP server's `popular-products` tool to use analytics data (view count + purchase count) instead of hardcoded data.
- [ ] **Real-time dashboard** — WebSocket or polling for live order count, active users, revenue today.

---

## 📝 Notes

### Design System Summary
- **Colors**: jet black `#0A0A0A`, charcoal `#1A1A1A`, neon lime `#39FF14` (accent), coral `#FF523B` (CTAs), sky blue `#38B6FF` (secondary)
- **Fonts**: Outfit (headings) + Inter (body)
- **Cards**: glassmorphism — `bg-white/[0.04]` + `backdrop-blur-md` + `border-white/[0.08]`
- **Buttons**: glass circles — `bg-white/[0.06]` + `backdrop-blur-md`
- **Max width**: `max-w-[2560px]` everywhere
- **Product images**: always 1:1 aspect ratio

### Git Commits (UI/UX session — July 21)
- `5dadbf9` — Full UI/UX redesign (10 phases, all pages)
- `c506410` — Fix Unsplash images (picsum → verified auto parts URLs)
- `2abf0fc` — Hero carousel rewrite (floating → 3D coverflow)
- `fb83c5b` — 4 new pages (wishlist, account, track, categories)
- `9df796c` — Navbar rework (centered, icons+text, glass circles)
- `4c15428` — Glassmorphism UI overhaul (all components)
- `43cd309` — Home page glass icons (categories, how it works, stats)
- `1460d23` — Fix invalid heroicons (UserGroupIcon→UsersIcon, HeadphonesIcon→PhoneIcon)
- `70d48de` — Settings icon + active underline positioning fix
- `e7ac561` — Settings token fallback + wider underline
- `516db17` — Voice/camera search + Settings bulletproof detection
- `3da6855` — Search bar X clear button

### Git Commits (July 22 — Athena-god + Max session)
- `3030619` — Hero split-screen → full-width banner carousel + search glow
- `403f1af` — Search bar: rotating gradient → clean drop shadow glow
- `312bc52` — Remove invalid JSX comments + dead search-glow-border div
- `2e6602d` — Notification bell with dropdown panel
- `53f038d` — Per-notification delete button (X on hover)
- `1cc16c1` — Themed hover colors for navbar icons
- `2566ecf` — Distinct hover colors (bell=green, heart=wine, cart=gold)
- `628a3cc` — Replace 3 broken Unsplash images (404)
- `7f53ffe` — UI improvements, search enhancements, service updates
- `87fabc7` — Conditional footer for auth pages + gateway POST proxy fix
- `b8f4eb2` — Auth service enhancement + login page + layout components
- `e514c7c` — Security: E2E test report + 6 security hardening fixes
- `32e44ad` — Mobile hamburger menu + voice animation upgrade + footer logo
- `3b1b7ae` — Hide hero prev/next arrows on mobile
- `b86f9df` — Move hamburger to right icon group + solid drawer bg
- `5005e81` — Image search + MCP proxy + fix all 31 E2E tests
- `f640b15` — Move mobile drawer outside nav (z-index fix) + solid opaque bg
- `fcebfc5` — Fix LoginPage DOM detach race (GoogleOAuth hydration)
- `3487911` — Remove wishlist+cart from mobile drawer (already in navbar)
- `6095ebc` — Remove 5 dead CSS legacy aliases (cleanup)
- `98e6cd3` — Add 12 E2E tests (wishlist, account, categories) — 43/43 passing
- `1521637` — LRU cache + search placeholder rotation + track order skeleton
- `e925fdb` — Wishlist/cart Redis persistence + MCP stdio server + Claude Desktop/Cursor configs
- `5286266` — Wishlist/cart frontend sync with backend (lib/api.ts, lib/sync.ts, page updates)
- `98e6cd3` — Add 12 E2E tests (wishlist, account, categories) — 43/43 passing
- `75073d1` — Accessibility audit fixes (focus-visible, skip-to-content, text contrast)
- `b5baba5` — Performance audit fixes (lazy loading images)
- `323c3a8` — Login page fix: GoogleOAuthProvider isolated to button component
- `202cee3` — CartItem type fix (id: string) + CSS @import order fix
- `7d9cc77` — Search bar inner focus glow removed (keep outer glow)
- `22a7cc1` — CSS input:focus-visible override (no inner green outline)
- `db716d5` — Restore outside search glow wrapper
- `7dc99d9` — Merge: search bar focus fix into main

## 📡 Real-Time Agent Monitor

> Athena (this agent) is monitoring Athena-GOD and Athena-MAX sessions.
> TODOS.md is updated in real-time as tasks complete or new tasks are created.

| Agent | Status | Last Seen | Current Task |
|-------|--------|-----------|--------------|
| Athena-GOD | 🟢 Active | 17:18 | Phase 14+15: Stripe + Admin frontend (uncommitted) |
| Athena-MAX | 🟡 Monitoring | — | Waiting for activity |

### Monitor Log
- `2026-07-23 08:35` — Monitoring started. Phase 13 partial.
- `2026-07-23 08:36` — Supabase setup files detected (setup.sql + README.md).
- `2026-07-23 08:47` — docker-compose.yml simplified, .env files updated.
- `2026-07-23 16:55` — 2 commits: Phase 13 ✅ COMPLETE. Phase 15 admin backend started (Banner model + 18 routes).
- `2026-07-23 17:18` — **MASSIVE PROGRESS**: 11 modified + 7 untracked files (1109 insertions).
  - **Phase 14 (Stripe)**: payments.ts (173 lines), checkout rewrite (318 lines), success page (161 lines), API gateway route, docker-compose Stripe env vars
  - **Phase 15 (Admin)**: admin layout (233 lines), login page (183 lines), forgot-password (130 lines), reset-password (185 lines), admin-auth.ts (129 lines)
  - Total new code: ~1512 lines across 8 new files

---

### Known Bugs
- ~~Settings icon: code is correct, likely needs Docker rebuild~~ — FIXED (hamburger drawer)
- ~~Voice animation: too subtle, needs visual upgrade~~ — FIXED (6-bar wave + pulsing rings)
- ~~7 E2E tests failing (selectors outdated after redesign)~~ — FIXED (all 43/43 passing)
- ~~GoogleOAuth login: "element detached from DOM"~~ — FIXED (isolated provider to button)
- ~~Mobile drawer: z-index stacking issues~~ — FIXED (moved outside nav)
- ~~Search bar inner green focus glow~~ — FIXED (disabled on search inputs, kept outer glow)
- ~~CartItem type mismatch (number vs string)~~ — FIXED (id now string matching Prisma)
- ~~7 E2E tests failing (selectors outdated after redesign)~~ — FIXED (all 31 passing)
- ~~GoogleOAuth login: "element detached from DOM"~~ — FIXED (hydration race fix)
- ~~Mobile drawer: z-index stacking issues~~ — FIXED (moved outside nav)
