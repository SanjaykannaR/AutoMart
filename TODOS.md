# AutoMart — Complete Project Todos

> Branch: `sanjay` (merged to `main`)
> All phases marked ✅ are fully committed and pushed.

## Phase 1: Foundation & Dev Setup ✅
- [x] Install dependencies: `npm install` in root (513 packages)
- [x] Add missing package.json files with correct dependencies for all services
- [x] Add tsconfig.json for all services (including order-service and inventory-service fixes)
- [x] Add .nvmrc with `20`
- [ ] Add ESLint config for the monorepo
- [ ] Add README.md with project overview
- [ ] Add CONTRIBUTING.md

## Phase 2: Database & Prisma ✅
- [x] Run `npx prisma migrate dev` for auth-service
- [x] Run `npx prisma migrate dev` for product-service
- [x] Run `npx prisma migrate dev` for order-service
- [x] Run `npx prisma migrate dev` for inventory-service
- [x] Seed script for product-service (24 products, 8 categories)
- [x] Seed script for auth-service (4 test users)
- [x] SQLite for local dev (all schemas converted)

## Phase 3: Backend Services ✅
- [x] Auth service — register/login/me with JWT, clear error messages
- [x] Product service — CRUD + categories, clear error messages
- [x] Search service — Fuse.js fuzzy + Trie autocomplete + image search
- [x] Order service — CRUD + status tracking + Redis events, clear error messages
- [x] Inventory service — reserve/release/confirm, clear error messages
- [x] Notification service — Redis pub/sub email/SMS, clear error messages
- [x] API Gateway — proxy + rate limit + auth middleware, clear error messages
- [x] MCP Server — 5 tools (search, stock, orders, categories, popular), clear error messages

## Phase 4: Frontend Pages ✅
- [x] Landing page with hero and categories
- [x] Login/register forms with validation
- [x] Search page with text search
- [x] Product detail page
- [x] Cart add/remove/quantity
- [x] Checkout form with validation
- [x] Order tracking with status timeline
- [x] Responsive design (mobile + desktop)

## Phase 5: Search Algorithms ✅ (partial)
- [x] Implement Trie for autocomplete suggestions
- [x] 10/10 unit tests for Trie (vitest)
- [x] Fuse.js fuzzy text search
- [ ] Implement TF-IDF scoring for text search
- [ ] Add real CLIP model integration for image search
- [ ] Add FAISS vector index for image embedding search
- [ ] Add voice search transcript processing
- [ ] Write unit tests for more search algorithms

## Phase 6: E2E Testing
- [ ] Run Playwright tests: `npm run test:e2e`
- [ ] Fix any failing tests
- [ ] Add tests for voice search flow
- [ ] Add tests for image search flow
- [ ] Add tests for order tracking ETA
- [ ] Add visual regression tests

## Phase 7: CI/CD Pipeline ✅
- [x] CI workflow (.github/workflows/ci.yml) — backend build matrix + frontend build
- [ ] Verify E2E workflow triggers on deploy
- [ ] Verify Docker build workflow pushes to ghcr.io
- [ ] Add branch protection rules

## Phase 8: Docker & Deployment ← IN PROGRESS
- [ ] Fix Docker Compose to run all 8 services + Redis
- [ ] Verify inter-service communication in Docker network
- [ ] Test `docker compose up` locally with full stack
- [ ] Add Prisma migrate + seed to Docker startup
- [ ] Deploy frontend to Vercel
- [ ] Deploy backend services to Render

## Phase 9: MCP Integration
- [ ] Test MCP server endpoints with curl/Postman
- [ ] Connect MCP server to Claude Desktop / Cursor
- [ ] Add more MCP tools (place_order, get_recommendations)

## Phase 10: Polish & Resume
- [x] Add toast notifications for actions (Toast.tsx + context)
- [x] Add error boundaries for routes (ErrorBoundary.tsx + app/error.tsx)
- [x] Add dark/light theme toggle (ThemeToggle.tsx + localStorage)
- [x] Clear, descriptive error messages across all 8 services (code + message + hint)
- [ ] Add loading skeletons to all pages
- [ ] Add PWA support (manifest, service worker)
- [ ] Write project README with architecture diagrams
- [ ] Create demo video / screenshots
- [ ] Add to resume with bullet points about architecture

## DSA Implemented
- [x] Trie — autocomplete search suggestions (with DSA docs in trie.ts)
- [ ] Levenshtein Distance — spell correction
- [ ] TF-IDF — term frequency scoring
- [ ] Cosine Similarity — vector comparison
- [ ] LRU Cache — recently viewed products
- [ ] Priority Queue — order processing queue
- [ ] Bloom Filter — fast product existence check
- [ ] BFS/Dijkstra — delivery route optimization
