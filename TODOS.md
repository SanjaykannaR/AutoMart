# AutoMart — Project Todos

> Branch: `sanjay` (merged to `main`)
> Last updated: 2026-07-21

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

## 🔴 TODO for Tomorrow (2026-07-22)

### 🔥 CRITICAL — Must Fix
- [x] **Settings icon not visible in navbar** — Fixed: added mobile hamburger drawer with all nav links (including Settings). Desktop nav already worked. Code: `Navbar.tsx` + `Bars3Icon` import + `mobileMenuOpen` state + slide-in panel.
- [x] **Voice search needs better listening animation** — Fixed: 3-layer pulsing rings (voice-ring keyframe), stronger glow `shadow-[0_0_20px]`, 6-bar sound wave animation, "Listening..." text indicator below mic button.
- [x] **Rebuild Docker container** — Rebuilt all 10 containers (web + 8 services + Redis). All healthy. Web on `http://localhost:3080`.

### HIGH Priority — Core Functionality
- [ ] **Verify E2E tests pass with Docker stack** — 7 tests failing post-redesign (selectors need updating for new UI elements)
- [ ] **Test MCP server endpoints with curl/Postman** — Validate all 5 tools work correctly over HTTP
- [ ] **Search page: image search mode** — When user uploads photo via camera icon, show visual matching results (currently shows banner but doesn't do actual image matching)
- [x] **Mobile hamburger menu** — Fixed: slide-in drawer from left with all nav links, search, profile/sign-in, wishlist+cart counts. Visible on `md:hidden`.

### MEDIUM Priority — Production Ready
- [ ] **Loading skeletons on all pages** — Better UX during data fetch, prevents layout shift
- [ ] **LRU Cache — recently viewed products** — DSA feature, improves performance
- [ ] **Connect MCP server to Claude Desktop / Cursor** — Full integration test
- [ ] **Search bar placeholder rotation** — Cycle through suggestions like "brake pads", "oil filter", "spark plugs"
- [ ] **Wishlist persistence** — Currently localStorage only, should sync with backend when logged in
- [ ] **Cart persistence for logged-in users** — Sync localStorage cart with backend

### LOW Priority — Nice to Have
- [ ] **PWA support (manifest, service worker)** — Offline capability, installable app
- [ ] **Priority Queue — order processing queue** — DSA feature
- [ ] **Dark mode toggle removal cleanup** — Remove any remaining light theme CSS/components that are dead code
- [ ] **Accessibility audit** — Ensure all glassmorphism elements meet WCAG contrast ratios
- [ ] **Performance audit** — Lighthouse score, bundle size analysis
- [ ] **E2E tests for new pages** — Wishlist, Account, Categories, Track order

---

## 📝 Notes

### Design System Summary
- **Colors**: jet black `#0A0A0A`, charcoal `#1A1A1A`, neon lime `#39FF14` (accent), coral `#FF523B` (CTAs), sky blue `#38B6FF` (secondary)
- **Fonts**: Outfit (headings) + Inter (body)
- **Cards**: glassmorphism — `bg-white/[0.04]` + `backdrop-blur-md` + `border-white/[0.08]`
- **Buttons**: glass circles — `bg-white/[0.06]` + `backdrop-blur-md`
- **Max width**: `max-w-[2560px]` everywhere
- **Product images**: always 1:1 aspect ratio

### Git Commits (UI/UX session)
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

### Known Bugs
- Settings icon: code is correct, likely needs Docker rebuild
- Voice animation: too subtle, needs visual upgrade
- 7 E2E tests failing (selectors outdated after redesign)
