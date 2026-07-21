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

---

## 🔴 Balance Tasks (Priority Based)

### 🔥 CRITICAL — Full UI/UX Redesign
- [ ] **Share design vision** — Provide reference images, competitor sites, color/style preferences (see "How to Share Design Ideas" below)
- [ ] **Redesign Landing Page** — Modern e-commerce hero, featured products, categories, promotions
- [ ] **Redesign Product Listing/Catalog** — Grid/list views, filters sidebar, sorting, pagination
- [ ] **Redesign Product Detail Page** — Image gallery, specs, reviews, add-to-cart, related products
- [ ] **Redesign Cart & Checkout** — Step-by-step checkout, order summary, payment UI
- [ ] **Redesign Auth Pages** — Clean login/register with social login buttons
- [ ] **Redesign Order Tracking** — Visual status timeline, order history
- [ ] **Global Design System** — Consistent colors, typography, spacing, components (buttons, cards, modals)
- [ ] **Mobile-First Responsive** — Ensure all pages work perfectly on phone/tablet
- [ ] **Update E2E Tests** — Fix Playwright selectors to match new UI

### HIGH Priority — Core Functionality
- [x] **Add ESLint config for monorepo** — ✅ Done (0 errors, 38 warnings across 9 workspaces)
- [ ] **Verify E2E tests pass with Docker stack** — Start full Docker Compose stack, run Playwright tests, fix any failures
- [ ] **Test MCP server endpoints with curl/Postman** — Validate all 5 tools work correctly over HTTP

### MEDIUM Priority — Production Ready
- [ ] **Connect MCP server to Claude Desktop / Cursor** — Full integration test of MCP tools in real client
- [ ] **Add loading skeletons to all pages** — Better UX during data fetch, prevents layout shift
- [ ] **LRU Cache — recently viewed products** — DSA feature, improves performance for repeat visits

### LOW Priority — Nice to Have
- [ ] **PWA support (manifest, service worker)** — Offline capability, installable app
- [ ] **Priority Queue — order processing queue** — DSA feature, enhances order processing architecture
