# AutoMart — Complete Project Todos

## Phase 1: Foundation & Dev Setup
- [ ] Install dependencies: `npm install` in root
- [ ] Add missing package.json files with correct dependencies for all services
- [ ] Add tsconfig.json for notification-service and mcp-server (already have most)
- [ ] Add ESLint config for the monorepo
- [ ] Add .nvmrc with `20`
- [ ] Add README.md with project overview
- [ ] Add CONTRIBUTING.md

## Phase 2: Database & Prisma
- [ ] Run `npx prisma migrate dev` for auth-service (first migration)
- [ ] Run `npx prisma migrate dev` for product-service
- [ ] Run `npx prisma migrate dev` for order-service
- [ ] Run `npx prisma migrate dev` for inventory-service
- [ ] Add seed script for product-service (sample parts data)
- [ ] Add seed script for auth-service (test users)

## Phase 3: Backend Services
- [ ] Start auth-service and verify register/login endpoints
- [ ] Start product-service and verify CRUD endpoints
- [ ] Start search-service and verify fuzzy text search works
- [ ] Start order-service and verify order creation
- [ ] Start inventory-service and verify stock reservation
- [ ] Start notification-service and verify Redis pub/sub
- [ ] Start api-gateway and verify proxying to all services
- [ ] Start mcp-server and verify tool discovery

## Phase 4: Frontend Pages
- [ ] Verify landing page renders with hero and categories
- [ ] Verify login/register forms submit correctly
- [ ] Verify search page with text search works
- [ ] Verify voice search (Web Speech API) in Chrome/Edge
- [ ] Verify image search upload flow
- [ ] Verify product detail page loads by ID
- [ ] Verify cart add/remove/quantity
- [ ] Verify checkout form with validation
- [ ] Verify order tracking with status timeline
- [ ] Verify responsive design (mobile + desktop)

## Phase 5: Search Algorithms (Learning)
- [ ] Implement Trie for autocomplete suggestions
- [ ] Implement TF-IDF scoring for text search (beyond Fuse.js)
- [ ] Add real CLIP model integration for image search (Python microservice)
- [ ] Add FAISS vector index for image embedding search
- [ ] Add voice search transcript processing and confidence scoring
- [ ] Write unit tests for search algorithms
- [ ] Document each DSA used (Trie, Levenshtein, Cosine Similarity, HNSW)

## Phase 6: E2E Testing
- [ ] Run Playwright tests: `npm run test:e2e`
- [ ] Fix any failing tests
- [ ] Add tests for voice search flow
- [ ] Add tests for image search flow
- [ ] Add tests for order tracking ETA
- [ ] Add visual regression tests (screenshot comparison)
- [ ] Add API mocking for third-party services in tests

## Phase 7: CI/CD Pipeline
- [ ] Push to GitHub and verify CI workflow runs
- [ ] Verify E2E workflow triggers on deploy
- [ ] Verify Docker build workflow pushes to ghcr.io
- [ ] Add branch protection rules (main requires CI passing)
- [ ] Add Dependabot config for auto-updates

## Phase 8: Docker & Deployment
- [ ] Test `docker compose up` locally with all services
- [ ] Verify inter-service communication in Docker network
- [ ] Deploy frontend to Vercel (free)
- [ ] Deploy backend services to Render (free tier)
- [ ] Deploy Postgres to Neon (free tier)
- [ ] Deploy Redis to Redis Stack (free tier)
- [ ] Configure custom domain (optional)

## Phase 9: MCP Integration
- [ ] Test MCP server endpoints with curl/Postman
- [ ] Connect MCP server to Claude Desktop
- [ ] Connect MCP server to Cursor IDE
- [ ] Add more MCP tools (place_order, get_recommendations)
- [ ] Add MCP resources (catalog, inventory reports)
- [ ] Add MCP prompts (standard order flow, troubleshooting)

## Phase 10: Polish & Resume
- [ ] Add loading skeletons to all pages
- [ ] Add error boundaries for each route
- [ ] Add toast notifications for actions
- [ ] Add PWA support (manifest, service worker)
- [ ] Add dark/light theme toggle
- [ ] Write project README with architecture diagrams
- [ ] Create demo video / screenshots
- [ ] Add to resume with bullet points about architecture
- [ ] Create case study document

## DSA to Implement & Learn
- [ ] Trie — autocomplete search suggestions
- [ ] Levenshtein Distance — spell correction in search
- [ ] Bitap Algorithm — fuzzy string matching (Fuse.js)
- [ ] TF-IDF — term frequency scoring
- [ ] Cosine Similarity — vector comparison (image search)
- [ ] k-NN / ANN — nearest neighbor search
- [ ] HNSW Graph — efficient vector index
- [ ] Priority Queue — order processing queue
- [ ] LRU Cache — recently viewed products
- [ ] Bloom Filter — fast product existence check
- [ ] BFS/Dijkstra — delivery route optimization
- [ ] Saga Pattern — distributed transactions (order flow)

## Industry Concepts Covered
- [ ] Monorepo (npm workspaces)
- [ ] Microservices architecture (DDD bounded contexts)
- [ ] API Gateway pattern (routing, auth, rate-limit)
- [ ] Event-driven architecture (Redis Pub/Sub)
- [ ] CQRS (read vs write separation in search)
- [ ] Database-per-service pattern
- [ ] Containerization (Docker, Compose)
- [ ] CI/CD (GitHub Actions)
- [ ] E2E testing (Playwright, sharding)
- [ ] MCP (Model Context Protocol)
- [ ] Vector search (CLIP + FAISS concept)
- [ ] JWT authentication
