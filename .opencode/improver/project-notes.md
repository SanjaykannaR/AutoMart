# Project Notes - automart

## Agent Optimization (2026-07-23)
- Created shared `AGENTS.md` with common instructions (Git discipline, output formats, quality gates)
- Trimmed all agent files to reference AGENTS.md, reducing token usage by ~40-60%
- Specialist agents (backend, frontend, general, hermes, testing, explore) now focus on domain-specific content only
- Created `MULTI_AGENT_GUIDE.md` for using the multi-agent system effectively
- Key benefit: faster development through parallel agent usage, better token efficiency

## Docker Storage (2026-07-21)
- Docker data root changed from C: to D:\Docker via `daemon.json`
- Old Docker data (20GB) cleaned from `C:\Users\DELL\AppData\Local\Docker`
- Created `scripts/docker-cleanup.sh` and `scripts/docker-cleanup.bat` for pre-test cleanup
- Workflow: run cleanup script before `docker compose up` to keep disk clean

## Deployment — Render Free Tier (2026-07-28)
- Railway credits exhausted → migrated to Render single-container deployment
- **Dockerfile.prod**: 3-stage build, all 8 services in one container, only port 3000 exposed
- **scripts/start-prod.sh**: Process manager — starts each service on different localhost port, auto-sets `*_SERVICE_URL`, graceful shutdown with SIGTERM
- **render.yaml**: Render blueprint (Docker runtime, free plan)
- **Upstash Redis**: Used instead of Railway Redis (free tier: 10K commands/day)
- **MCP server**: Updated with `svc()` helper — uses `*_SERVICE_URL` env vars instead of hardcoded Docker DNS names
- **Key constraint**: ALL services MUST use `*_SERVICE_URL` env vars or localhost for inter-service calls. Docker DNS names (e.g., `auth-service:3001`) do NOT work in single-container mode.

## Project Structure
- Multi-service: api-gateway, auth, inventory, mcp-server, notification, order, product, search
- Frontend: apps/web
- Docker Compose files: docker-compose.yml (prod), docker-compose.dev.yml (dev)
- Dockerfile.prod: single-container production build for Render

## RAG + AI Chatbot Architecture (2026-08-01) — design decision, not yet built
- User request: RAG for product recommendation + "machine" persona chatbot, clean/smooth UI
- Existing assets: search-service already has Fuse.js+TF-IDF lexical search, CLIP image embeddings (512d, local ONNX), custom IVF vector index, Trie autocomplete
- Missing pieces identified: text semantic embeddings, LLM layer, orchestration service, reranker, personalization context
- Decided architecture:
  - New `assistant-service` (port 3008) orchestration + `/chat` + `/recommend` endpoints
  - Hybrid retrieval: existing lexical (search-service) ⊕ semantic text embeddings → RRF merge → optional cross-encoder rerank
  - Text embedding: local Xenova/all-MiniLM-L6-v2 (384d) MVP, API embedding (OpenAI/Gemini) only if catalog >100K
  - Vector persistence: Supabase pgvector (`product_embeddings` table, one row per product; product chunks are small — no long-doc chunking needed)
  - LLM: provider-agnostic (OpenAI gpt-4o-mini / Gemini Flash), structured JSON output, streaming SSE
  - Persona: "machine" — short factual answers + inline ProductCard rail + status readouts, no hallucinated specs
  - UI: global FAB in LayoutShell → chat drawer; reuse ProductCard, framer-motion (ChatReveal variant), dark theme CSS vars
  - Second corpus: support knowledge (FAQs, fitment guides) so machine answers "will this fit my vehicle?"
- Constraints to remember: Render single-container (use `*_SERVICE_URL` env vars), Upstash Redis limits (10K cmds/day — semantic cache must be conservative), product Prisma schema has no text-search vector yet

## RAG cost decision — 100% FREE (2026-08-01)
- User constraint: resume demo, CANNOT pay for anything. Verified current 2026 free tiers via web search.
- All free: Supabase pgvector (built-in ext, free plan), local Xenova embeddings (MiniLM-L6-v2 384d, ~25MB), Upstash Redis 10K cmd/day, Render free container (512MB)
- ONLY external dependency: LLM API key, free tier, no credit card:
  - Gemini Flash (AI Studio): 1,500 RPD / 15 RPM / 1M TPM, free input+output, no expiry. PRIMARY choice. Caveat: free data trains Google models; limits vary by region.
  - Groq (llama-3.1-8b-instant): 14,400 RPD / 30 RPM / 6K TPM. Faster = better "machine feel". FALLBACK.
- assistant-service MUST have `LLM_PROVIDER=gemini|groq|template` env-switchable adapter + a no-LLM "template mode" (retrieval-only answers) as live-demo fallback
- Demo gotchas: Supabase free pauses after 7d inactivity (unpause before demo), Render cold start after 15m idle (warm up before demo), embed products at index time not per-request (512MB RAM)

## RAG P0+P1 COMPLETE (2026-08-01, resumed session)
- Backend `services/assistant-service` (port 3008) fully built: Express + zod, MiniLM embeddings (@xenova/transformers, 384d, deterministic fallback), pgvector client (graceful no-table degradation), hybrid retrieval (search-service lexical ⊕ pgvector kNN → RRF merge, token-overlap boost), LLM adapter (template|gemini|groq with JSON contract + fallback), SSE streaming, reindex worker (startup + 5min loop)
- Frontend chat widget: `components/chat/{useChat,ChatWidget,ChatPanel,ChatMessage}.tsx`, mounted in LayoutShell (hidden on AUTH_PAGES), reuse ProductCard rail, framer-motion springs, `.caret` CSS
- Wiring: api-gateway `/assistant` route (prefix KEPT — routes are `/assistant/chat` etc, matching repo pattern), docker-compose.yml + dev override, Dockerfile.prod (3 stages), start-prod.sh, render.yaml (LLM_PROVIDER/LLM_API_KEY), .env.example + .env.docker + .env.production.example
- BUGS FIXED during verification: (1) `retrieval.ts` local `semanticSearch()` shadowed pgvector import → infinite recursion + TS2440; renamed import to `pgvectorSemanticSearch`. (2) Service routes were `/chat` but gateway keeps `/assistant` prefix → 404; renamed to `/assistant/*`. (3) Pre-existing stale Prisma client in auth-service (banner model) — fixed by `prisma generate`
- VERIFIED: all 9 services `tsc --noEmit` clean (after prisma generate), apps/web build clean, SSE contract smoke-tested (status→text→products→chips→done), template mode zero-key works, gemini invalid-key falls back to template, MiniLM loads (384-dim)
- REMAINING for full E2E: run `supabase/migration-product-embeddings.sql` in Supabase SQL Editor (user action) → semantic search activates; docker compose up to test against live product-service; visual check of ChatWidget
- Untracked: `services/assistant-service/`, `supabase/migration-product-embeddings.sql`, `apps/web/src/components/chat/` — NOT committed yet (coordinated commit pending)
