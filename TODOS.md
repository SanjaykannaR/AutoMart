# AutoMart — Security Audit, Migration, & Deployment Complete

## ✅ Phase 1: Keep-Warm Workflow Fix
- [x] `.github/workflows/keep-warm.yml` — `--max-time 90` + `|| true` for Render cold boots

## ✅ Phase 2: Critical Security Fixes
- [x] `services/api-gateway/src/middleware/admin.ts` — new admin-only JWT middleware
- [x] `services/api-gateway/src/index.ts` — POST/PUT/PATCH/DELETE on `/products`, `/categories`, `/inventory`, `/orders` require admin
- [x] `services/auth-service/src/index.ts` — JWT fail-closed (`process.exit(1)`), removed `'dev-secret'`, null-guard in `verifyToken`
- [x] `services/order-service/src/index.ts` — GET ownership check, PATCH status admin-only
- [x] `apps/web/package.json` — `next ^15.5.22`, `postcss ^8.5.22`
- [x] `services/notification-service/package.json` — `nodemailer ^9.0.3`
- [x] `Dockerfile.prod` — `ENV NODE_ENV=production`

## ✅ Phase 3: @xenova/transformers → @huggingface/transformers Migration
- [x] `services/search-service/package.json` — `@huggingface/transformers ^4.2.0`
- [x] `services/assistant-service/package.json` — `@huggingface/transformers ^4.2.0`
- [x] `services/search-service/src/search/imageSearch.ts`:
  - Import swap
  - Pipeline task: `feature-extraction` → `image-feature-extraction` (v4 split)
  - Input: `data:` URI → `Blob` (v4 dropped data-URI support)
  - Inline `SECURITY (DEPS-1)` + v4 migration comments
- [x] `services/assistant-service/src/embedding.ts` — import swap (text pipeline unchanged)
- [x] `services/search-service/Dockerfile` — `node:20-alpine` → `node:20-slim` (glibc for onnxruntime-node) + curl
- [x] `services/assistant-service/Dockerfile` — comment refresh
- [x] Verified: tsc ✓, 75 tests ✓, web build ✓, e2e smoke (MiniLM 384-dim, CLIP 512-dim) ✓

## ✅ Phase 4: npm audit fix --force
- [x] `next` bumped to `^16.3.0` (clears next/postcss HIGHs)
- [x] Verified: web build ✓, search-service tsc+tests ✓

## 📊 Final Audit State
```
CRITICAL: 0 | HIGH: 4 | MODERATE: 0 | LOW: 0
```
- 4 residual HIGHs: `@huggingface/transformers` → `onnxruntime-node` (adm-zip) + `sharp` (libvips)
- **No fix available** (pinned at latest); **not attacker-reachable** (only process trusted HF model downloads)

## ✅ Phase 5: Docker Deploy — search-service healthcheck
- [x] Root cause: healthcheck used `wget` (not in `node:20-slim`) + `start_period: 10s` too short for CLIP model (~350MB) download
- [x] `docker-compose.yml` — search-service healthcheck → `curl`, `start_period: 180s`

## ✅ Phase 6: Vercel Deployment Fixes
- [x] Root cause: invalid `rootDirectory` property in `vercel.json` → "should NOT have additional property `rootDirectory`"
- [x] Resolved to modern **`services` schema** (Vercel's official monorepo config):
  ```json
  { "services": { "web": { "root": "apps/web", "framework": "nextjs" } }, "rewrites": [...] }
  ```
- [x] No `rootDirectory` / `outputDirectory` / `buildCommand` workarounds — proper Vercel format

## ✅ Phase 7: CI E2E — product category filter tests (flaky → fixed)
- [x] Root cause 1: `<select>` is client-side React-rendered; options load from `/api/categories` (Supabase DB)
- [x] Root cause 2: Playwright `toBeVisible()` on native `<option>` always fails (options are "hidden" until dropdown opens)
- [x] Root cause 3: hardcoded `Brake System`/`Brake Parts` unstable across envs (deployed DB loads live categories)
- [x] `e2e/pages/SearchPage.ts` — `waitForCategoryOptions()` → waits `toBeAttached()` (presence, not visibility); added data-driven `getFirstCategory()`
- [x] `e2e/tests/product/search.spec.ts` — test reads actual rendered option value instead of hardcoding category name
- [x] Verified: search e2e 6/6 passing locally against merged build

## ✅ Phase 8: Merge to main & Deploy
- [x] Branch `sanjay` → `main` (merged `main` in first to resolve the 52-file divergence)
- [x] `vercel.json` conflict resolved in favor of `services` schema
- [x] Verified before merge: web build ✓, all services tsc ✓, search-service 75 tests ✓, search e2e 6/6 ✓
- [x] `main` pushed (`4ea717f..ee0adc1`) — Vercel production deploy triggered
- [x] Vercel deploy **passed** on `main`

## 📦 Git
- [x] `sanjay` branch — all security, migration, e2e, vercel fixes
- [x] Merged into `main` (head `ee0adc1`), pushed

## ⏳ Future / Known
- [ ] Revisit 4 residual HIGHs when `sharp` ≥0.35 / `onnxruntime-node` patches `adm-zip`
- [ ] Full cross-browser e2e (firefox/webkit) in CI matrix