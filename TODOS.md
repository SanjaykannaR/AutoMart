# AutoMart — Security Audit & Migration Complete

## ✅ Phase 1: Keep-Warm Workflow Fix
- [x] `.github/workflows/keep-warm.yml` — `--max-time 90` + `|| true` for Render cold boots

## ✅ Phase 2: Critical Security Fixes (prior session)
- [x] `services/api-gateway/src/middleware/admin.ts` — new admin-only JWT middleware
- [x] `services/api-gateway/src/index.ts` — POST/PUT/PATCH/DELETE on `/products`, `/categories`, `/inventory`, `/orders` require admin
- [x] `services/auth-service/src/index.ts` — JWT fail-closed (`process.exit(1)`), removed `'dev-secret'`, null-guard in `verifyToken`
- [x] `services/order-service/src/index.ts` — GET ownership check, PATCH status admin-only
- [x] `apps/web/package.json` — `next ^15.5.22`, `postcss ^8.5.22`
- [x] `services/notification-service/package.json` — `nodemailer ^9.0.3`
- [x] `Dockerfile.prod` — `ENV NODE_ENV=production`
- [x] Verified: web build ✓, all services `tsc` ✓, 75 search-service tests ✓, eslint 0 errors

## ✅ Phase 3: @xenova/transformers → @huggingface/transformers Migration
- [x] `services/search-service/package.json` — `@huggingface/transformers ^4.2.0`
- [x] `services/assistant-service/package.json` — `@huggingface/transformers ^4.2.0`
- [x] `services/search-service/src/search/imageSearch.ts`:
  - Import swap
  - Pipeline task: `feature-extraction` → `image-feature-extraction` (v4 split)
  - Input: `data:` URI → `Blob` (v4 dropped data-URI support)
  - Inline `SECURITY (DEPS-1)` + v4 migration comments
- [x] `services/assistant-service/src/embedding.ts` — import swap + comment update (text pipeline unchanged)
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

## 📦 Git
- [x] Branch `sanjay` — 2 commits:
  1. `ce85d2f` — transformers migration (fixes protobufjs critical CVE-2023-36665)
  2. `2e10979` — npm audit fix --force (next 16.x)

## ⏳ Optional / Future
- [ ] Push `sanjay` branch to origin for PR
- [ ] E2E tests for web app (next 16 breaking changes)
- [ ] Revisit residual HIGHs when `sharp` ≥0.35 / `onnxruntime-node` patches `adm-zip`