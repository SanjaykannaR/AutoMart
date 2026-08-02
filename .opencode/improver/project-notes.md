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

## RAG semantic search VERIFIED LIVE in Supabase (2026-08-02)
- User said they ran the migration — confirmed via direct pg query against `mmvrkljevwgkonpljsut`:
  - `vector` ext v0.8.2 enabled ✅, `product_embeddings` table exists ✅, HNSW index `product_embeddings_hnsw_idx` (cosine) exists ✅
  - **25 rows populated** (`all-MiniLM-L6-v2`, embedded 2026-07-31 → worker already ran), 0 nulls, 0 zero-vectors
  - kNN cosine query returns sensible results (LED fog light self-match 1.0, LED headlight 0.51, LED tail light 0.36)
- → Semantic search is ACTIVE in prod; the RAG-task.md note about "migration pending" is now obsolete
- Worker re-syncs on next service start (idempotent, skips unchanged `updated_at`) — nothing manual needed after catalog edits
- Verification script pattern: read `DATABASE_URL` from `.env.docker`, query via `pg` with `ssl:{rejectUnauthorized:false}`

## Voice search fix — "Microphone blocked" despite grant (2026-08-02)
- Root cause: Chrome 125+ has a SEPARATE "Speech recognition" site permission (lock icon → Site settings), distinct from Microphone. Granting only mic → `SpeechRecognition` still fires `not-allowed`/`service-not-allowed`. Also: old hook never verified the mic, so "mic blocked" vs "speech service blocked" were indistinguishable, and plain-http (LAN IP) contexts blamed the mic.
- Fix in `apps/web/src/hooks/useVoiceSearch.ts` (uncommitted WIP):
  1. `getUserMedia({audio})` pre-flight in `start()` → forces correct permission prompt, precise per-error messages (NotAllowedError/NotFoundError/security), mic stream released after
  2. `not-allowed`/`service-not-allowed` now treated as speech-service issue (NOT mic) → actionable lock-icon instructions; auto-retries once after a fresh grant
  3. `network` error → separate "Google servers unreachable (region)" message
  4. `!window.isSecureContext` guard → https/localhost message instead of mic blame
  5. Unmount cleanup + `stop()` release pre-flight tracks
- `SearchBar.tsx` overlay heading changed "Mic unavailable" → "Voice search unavailable" (error can be service-level)
- Verified: `npx tsc --noEmit -p apps/web/tsconfig.json` clean. If user still blocked after fix → likely regional (network error) → LLM/key not involved; speech API needs Google servers
- ROUND 2 (same session): pre-flight `getUserMedia` itself fails with NotAllowedError despite site granted → mic-level, not speech-service. Upgraded `ensureMic()`: 2 attempts (retry once — Chrome flaky right after grant), then probes `navigator.permissions.query({name:'microphone'})` to triage:
  - `'granted'` + still failing → OS-level Windows privacy settings / origin mismatch (localhost vs 127.0.0.1 are different sites!) / mic held by another app / stale Chrome state → browser restart
  - `'prompt'` → not granted for THIS exact URL
  - `'denied'` → lock-icon fix + restart
  - User is on `http://localhost:3000` (secure context OK). "Speech recognition" option absent in their Chrome site settings — normal on Windows, not the blocker anymore.
  - KEY INSIGHT for future: user-reported "mic blocked" on Windows Chrome → check OS privacy toggle FIRST (`Settings → Privacy & security → Microphone`), not just site permissions.
- 🎯 **ROOT CAUSE FOUND (2026-08-02)**: `apps/web/next.config.ts` sends `Permissions-Policy: camera=(), microphone=(), geolocation=()` (added in commit `07dd405` "security headers" polish) → **the site itself blocks the microphone via HTTP header** on every page. `getUserMedia` fails with NotAllowedError REGARDLESS of site settings / OS privacy settings / hardware. User had granted mic, Windows privacy fully allowed (verified via ConsentStore registry), mic hardware OK — all moot.
  - FIX: `microphone=(self), camera=(self)` (own-origin only; geolocation still blocked). Applied to `next.config.ts`. **LESSON: `Permissions-Policy` blocking `microphone`/`camera` silently breaks voice/camera features — always audit feature usage before blanket-blocking.**
  - Requires dev-server restart + hard refresh (headers are server-side); if user previously denied, reset site permission via lock icon. Web app port: docker maps 3080:3000; `next dev` alone = 3000.

## Voice search round 3 — hero routing + STT query normalization (2026-08-02)
- **Issue A (hero bar types but doesn't search)**: Hero `onSearch` rendered results INLINE below the tall hero carousel — effectively invisible. ALSO: `/search` page never read `?q=` from URL on mount → navbar voice search (`router.push('/search?q=…')`) landed on an UNFILTERED page (latent bug since navbar voice existed).
  - Fixes: `SearchBar.tsx` gained optional `onVoiceSearch` prop (voice → this, text → onSearch); `Hero.tsx` passes through; `app/page.tsx` voice → `router.push('/search?q=…')` (matches navbar); `app/search/page.tsx` reads `urlQuery = searchParams.get('q')`, single effect `[filters, urlQuery]` fetches, `handleSearch` just navigates (kills double-fetch).
- **Issue B ("barking bad" → no results)**: STT homophones never corrected. `voiceSearch.ts` (previously DEAD code — `processVoiceTranscript` never imported) rewritten into `normalizeSearchQuery()`: phrase fixes ("braking/barking/bad"→"brake pad", "break disc|rotor|caliper", "hed light"→"headlight"), word map (tyre→tire, calliper→caliper, sparkplug→spark plug, etc.), leading filler strip ("i need", "show me", "please"), trailing politeness strip, punctuation cleanup. Wired into `/search` route — benefits typed + voice + TORQ assistant queries. Guard changed to `!query && !category && !brand`.
  - BUG caught by self-test: `$1` with non-capturing group → `'brake $1 rotor'`; fixed with capturing group. Tests: 7 new cases in `voiceSearch.test.ts`; all 68 search-service tests pass; web + search tsc clean.
- STILL UNCOMMITTED (all of today's work + earlier voice hook + next.config fix). Suggest one commit: "fix: voice search — permissions-policy, hero routing, URL query handling, STT query normalization".

## Voice search round 4 — "breaking bad" variant + SOUNDEX fallback (2026-08-02)
- User reported a THIRD STT variant ("breaking bad" — after "barking", "braking"). Curated homophone map is whack-a-mole → added a permanent phonetic layer.
- `voiceSearch.ts` additions:
  - `breaking` added to phrase regex + word map
  - `stemToken()` — proper plural-aware stemmer: brakes→brake, pads→pad, batteries→battery, breaking→break (min len 4; `>=3` guard protects gas/bus/air). BUG FOUND BY TEST: naive `/(?:es|s)$/` regex made "brakes"→"brak"; fixed with plural rules (plain `s` strip; `es` only after s/sh/ch/x/z; `ies`→y)
  - `soundex()` — standard American Soundex. All brake variants (brake/break/brack/breaking/braking/barking/bracking) → B620; headlight/hedlight → H342; pad P300 ≠ bad B300
  - `expandPhonetically(query, vocab)` — swaps unknown-sounding tokens for shortest known catalog word with same code
- `textSearch.ts`:
  - `phoneticVocab` (soundex code → shortest catalog word) built at index time from name+brand+category+vehicleType+compatibleVehicles
  - `fuzzySearch` refactored: extracted `scoreQuery()`; when zero results AND vocab non-empty → retry once with phonetic expansion
- Verified end-to-end vs real catalog: breaking/barking/braking bad → direct map; bracking/breck/brik pad → PHONETIC fallback; hedlight bulb → headlight. 75/75 tests pass, both tsc clean.
- LESSON: STT homophone fixes need BOTH a curated map (fast, predictable) AND a phonetic fallback (catches every future variant) — map alone never converges with real-world accents.
- NOTE for user: search-service restart REQUIRED (server-side change) — restarting only the web dev server is not enough.

## Voice search round 5 — local dev topology repair (2026-08-02)
- Real blocker behind "no item found": the LOCAL stack was never wired end-to-end. Chain: web(3080) → gateway(3000) → search-service(3003) → product-service(3002) → Supabase Postgres.
- Fixes applied:
  1. `search-service/src/search/textSearch.ts`: product fetch now tries PRODUCT_SERVICE_URL → docker DNS `product-service:3002` → `localhost:3002` (was docker-DNS-only → empty index locally)
  2. `product-service/package.json`: dev script `tsx watch --env-file=.env src/index.ts` (Prisma does NOT auto-load .env at runtime; CLI-only)
  3. `services/product-service/.env` (NEW, gitignored via root `.env` pattern): DATABASE_URL from .env.docker — Supabase pooler creds
  4. `api-gateway/src/index.ts` svc(): `dns.lookupSync(dockerHost)` → docker URL if resolves, else `localhost:<port>`; + `import dns from 'node:dns'`
  5. `apps/web/.env.local`: NEXT_PUBLIC_API_URL 3001→3000 (gateway). Backup: apps/web/.env.local.bak-20260802-130705
  6. Gateway routes are UNDER /api/* — `/api/search` NOT `/search` (web app already correct)
- Live-verified FULL chain: gw/api/breaking|barking|braking bad → Ceramic+Motorcycle Brake Pads (5); bracking pad → phonetic fallback (2); hedlight bulb → LED Headlight Bulb H4 (1). 25 products in catalog.
- Local dev port map: web 3080, gateway 3000, auth 3001, products 3002, search 3003, orders/payments 3004, inventory 3005, notifications 3006, mcp 3007, assistant 3008.
- LESSONS: (a) never trust that "docker DNS service names" resolve on the host — every service fetch/proxy needs a localhost fallback; (b) Prisma env is NOT runtime-loaded; (c) tsx watch restarts can EADDRINUSE-collide with the still-bound old child — kill the listener before relying on a reload.
- tsx watch auto-reloads code edits in all 4 running services (web 3080, gw 3000, products 3002, search 3003) — file edits are live.

## Voice search round 6 — search bar shows normalized text (2026-08-02)
- User: results correct ("breaking bad" → brake pads) but the bar still showed the raw STT text. Fixed by returning the corrected query from the API + syncing URL/bar.
- API: `/api/search` now returns `{ query, results }` instead of a bare array.
  - `fuzzySearch()` returns `{ results, query: effectiveQuery }` — effectiveQuery = phonetic-expanded alt when the zero-result retry matched, else the normalized input.
  - Empty guard returns `{ query: '', results: [] }`.
- Frontend:
  - `SearchBar`: new optional `value` prop + `useEffect` sync — input follows the URL query (also fixes navbar/hero nav leaving the bar empty).
  - `search/page.tsx`: parses `{ query, results }`; if server query differs from URL q → `router.replace('/search?q=<normalized>&<filters>', { scroll:false })` → bar + URL converge to "brake pad".
  - `app/page.tsx` Hero inline search: handles both array and object shapes.
- Verified: breaking bad → query "brake pad" (5); bracking/breck pad → Fuse fuzzy matches (2) so phonetic path doesn't fire, text stays as typed (correct behavior — bar shows the query that matched); hedlight bulb → "hedlight bulb" (1).
- NOTE: `fuzzySearch` signature changed (Product[] → {results, query}) — only 1 caller (index.ts /search), no tests reference it. 75/75 tests still pass, both tsc clean.

## Voice search round 7 — NAVBAR bar shows corrected text (2026-08-02)
- User: page SearchBar updated ("breaking bad"→"brake pad") but the NAVBAR bar still showed the raw transcript. Root cause: Navbar does NOT use the SearchBar component — it has its own inline input bound to local `searchQuery` state, so the round-6 `value` prop never reached it.
- Fix:
  - `Navbar.tsx`: added `useSearchParams`; `urlQuery = searchParams.get('q')||''`; new effect `useEffect(()=>setSearchQuery(urlQuery),[urlQuery])` — syncs after voice nav AND after the search page's `router.replace` to the normalized query.
  - `LayoutShell.tsx`: wrapped `<Navbar/>` in `<Suspense fallback={null}>` — Next 15 build requirement for useSearchParams in client components.
- Why no typing-clobber: the effect only fires when `urlQuery` CHANGES (typing doesn't change the URL); navigation does.
- LESSON: there are TWO search inputs in this app (SearchBar component + Navbar's inline one). Any query-sync fix must touch both. Consider refactoring Navbar to use SearchBar someday.

## Fix: gateway lookupSync doesn't exist (2026-08-02)
- CI (`npx tsc --noEmit`) failed: `dns.lookupSync` not on node:dns types — AND it's not in the runtime either (verified `typeof dns.lookupSync === 'undefined'` on Node 25). My round-5 gateway fallback always threw; locally the catch accidentally produced localhost, but in DOCKER it would ALSO have fallen to localhost — deployment-breaking.
- Fix in api-gateway/src/index.ts:
  - `ROUTES` table (prefix → envUrl/dockerHost/port) replacing inline router map
  - `resolveTarget()`: env override → `dns.promises.lookup(host)` (real async DNS; resolves in compose, ENOTFOUND locally) → localhost fallback; cached per hostname in `targetCache` (first request resolves, then instant)
  - HPM v3 `router` becomes an async function `(req) => Promise<string>` — GOTCHA: runtime calls it with `router(req)` (request object, NOT path despite types showing (path,req)) — use `req.url`. Verified against dist/router.js.
  - Re-added `protectedPaths`/`publicPaths` (accidentally dropped in first edit pass)
- Verified: gateway tsc clean; live: breaking/barking bad → brake pad (5), hedlight → LED headlight (1), /api/auth/health → 504 (auth-service not running locally — correct proxy behavior).
- LESSON: always run tsc for EVERY changed package before commit (I skipped gateway round 5 → CI caught it). And don't trust @types alone for node core APIs — verify runtime presence.
