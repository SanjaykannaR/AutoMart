# AutoMart — Project Todos

> Branch: `sanjay` (merged to `main`)
> 8 commits on `sanjay`, all pushed.

## Phase 1: Foundation & Dev Setup ✅
- [x] Install dependencies: `npm install` in root (513 packages)
- [x] Add missing package.json files with correct dependencies for all services
- [x] Add tsconfig.json for all services
- [x] Add .nvmrc with `20`
- [ ] Add ESLint config for the monorepo

## Phase 2: Database & Prisma ✅
- [x] Run `npx prisma migrate dev` for auth/product/order/inventory services
- [x] Seed scripts: 4 test users (auth), 24 products + 8 categories (product)
- [x] SQLite for local dev (all schemas converted)

## Phase 3: Backend Services ✅
- [x] Auth service — register/login/me with JWT
- [x] Product service — CRUD + categories
- [x] Search service — Fuse.js fuzzy + Trie autocomplete + image search
- [x] Order service — CRUD + status tracking + Redis events
- [x] Inventory service — reserve/release/confirm
- [x] Notification service — Redis pub/sub email/SMS
- [x] API Gateway — proxy + rate limit + auth middleware
- [x] MCP Server — 5 tools (search, stock, orders, categories, popular)
- [x] Structured error messages: `{ code, message, hint }` across all services

## Phase 4: Frontend Pages ✅
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

## Phase 5: Search Algorithms ✅ (partial)
- [x] Implement Trie for autocomplete suggestions
- [x] 10/10 unit tests for Trie (vitest)
- [x] Fuse.js fuzzy text search
- [ ] Implement TF-IDF scoring for text search
- [ ] Add real CLIP model integration for image search
- [ ] Add FAISS vector index for image embedding search

## Phase 6: E2E Testing ✅
- [x] Playwright config (chromium, retries, timeouts)
- [x] 6 Page Object Models (Login, Register, Search, ProductDetail, Checkout, Orders)
- [x] 6 test files: auth/login, auth/register, product/browse, product/search, order/place, order/track
- [x] Fixed selectors to match actual UI
- [ ] Verify tests pass with running Docker stack

## Phase 7: CI/CD Pipeline ✅
- [x] Backend build matrix (8 services in parallel)
- [x] Unit tests job (Vitest)
- [x] Frontend build job (Next.js)
- [x] Docker build check job
- [x] E2E tests job (Playwright + Docker Compose)

## Phase 8: Docker ✅
- [x] docker-compose.yml (SQLite + Redis, 8 services + web)
- [x] All 9 Dockerfiles (multi-stage, monorepo root context)
- [x] .dockerignore
- [x] Entry scripts with prisma migrate deploy
- [x] Healthchecks on all services
- [x] docker-compose.dev.yml (source mount + live reload)
- [x] .env.docker

## Phase 9: MCP Integration
- [x] MCP server with 5 tools
- [ ] Test MCP server endpoints with curl/Postman
- [ ] Connect MCP server to Claude Desktop / Cursor

## Phase 10: Polish & Resume ✅
- [x] Toast notifications
- [x] Error boundaries
- [x] Dark/light theme toggle
- [x] Structured error messages
- [x] README.md with architecture, setup, API docs, project structure
- [ ] Add loading skeletons to all pages
- [ ] PWA support (manifest, service worker)

## DSA Implemented
- [x] Trie — autocomplete search suggestions (with DSA docs in trie.ts)
- [x] Levenshtein Distance / Bitap — fuzzy string matching (Fuse.js)
- [ ] TF-IDF — term frequency scoring
- [ ] Cosine Similarity — vector comparison
- [ ] LRU Cache — recently viewed products
- [ ] Priority Queue — order processing queue
