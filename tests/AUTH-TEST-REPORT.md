# AutoMart Auth — E2E Test Report & Security Audit

**Date:** 2026-07-22
**Tested by:** Athena-GOD (automated)
**Environment:** Docker Compose (10 services), SQLite + Redis
**Gateway:** `http://localhost:3000`

---

## E2E Test Results — 28/28 PASSED

### 1. Registration

| # | Test | HTTP | Expected | Result |
|---|---|---|---|---|
| 1 | Register new user | 201 | token + user | PASS |
| 2 | Duplicate email rejection | 409 | AUTH_EMAIL_TAKEN | PASS |

### 2. Email/Password Login

| # | Test | HTTP | Expected | Result |
|---|---|---|---|---|
| 3 | Login with valid credentials | 200 | token + user | PASS |
| 4 | Login wrong password | 401 | "Invalid email or password." | PASS |
| 5 | Login non-existent email | 401 | "Invalid email or password." (same msg) | PASS |
| 6 | Login missing fields | 400 | Zod validation error | PASS |
| 7 | Login invalid email format | 400 | Zod validation error | PASS |

### 3. OTP Flow

| # | Test | HTTP | Expected | Result |
|---|---|---|---|---|
| 8 | OTP Send | 200 | success + devCode | PASS |
| 9 | OTP Verify (correct code) | 200 | token + phoneVerified:true | PASS |
| 10 | OTP Verify (wrong code) | 401 | "Incorrect OTP. N remaining." | PASS |
| 11 | OTP max attempts (3 wrong) | 429 | AUTH_OTP_MAX_ATTEMPTS | PASS |
| 12 | OTP Resend (old invalidated) | 200 | success + new devCode | PASS |
| 13 | OTP Verify after expired | 400 | AUTH_OTP_EXPIRED | PASS |

### 4. OAuth

| # | Test | HTTP | Expected | Result |
|---|---|---|---|---|
| 14 | Google OAuth (new user) | 200 | token + isNewUser:true | PASS |
| 15 | Google OAuth (existing user) | 200 | same user ID (idempotent) | PASS |
| 16 | OAuth missing provider | 400 | Zod validation error | PASS |
| 17 | OAuth invalid provider | 400 | "Expected 'google' \| 'apple'" | PASS |

### 5. Password Reset

| # | Test | HTTP | Expected | Result |
|---|---|---|---|---|
| 18 | Forgot password (real email) | 200 | success + devCode | PASS |
| 19 | Forgot password (fake email) | 200 | same response (no info leak) | PASS |
| 20 | Reset with correct code | 200 | success | PASS |
| 21 | Login with new password | 200 | token returned | PASS |
| 22 | Login with old password | 401 | rejected | PASS |
| 23 | Reset max attempts (3 wrong) | 429 | AUTH_RESET_MAX_ATTEMPTS | PASS |

### 6. Profile & JWT

| # | Test | HTTP | Expected | Result |
|---|---|---|---|---|
| 24 | Profile setup (with JWT) | 200 | updated user | PASS |
| 25 | Profile setup (no JWT) | 401 | AUTH_NO_TOKEN | PASS |
| 26 | GET /me (valid JWT) | 200 | user profile | PASS |
| 27 | GET /me (no token) | 401 | AUTH_NO_TOKEN | PASS |
| 28 | GET /me (forged JWT) | 401 | AUTH_NO_TOKEN | PASS |

---

## Bugs Found & Fixed

| ID | Severity | Description | Status |
|---|---|---|---|
| B1 | HIGH | OTP verify 500 crash when prior OTP user has `phone:null` — `findFirst({phone})` misses, then `create()` hits unique constraint on email | FIXED — added `findUnique({email})` fallback + P2002 catch + phone backfill |
| B2 | MED | OTP max attempts off-by-one: attacker got 4 attempts instead of 3 | FIXED — `attempts >= 3` check now before increment |
| B3 | MED | Password reset same off-by-one as B2 | FIXED — same pattern applied |
| S1 | HIGH | Email enumeration on login: different error messages for "wrong password" vs "user not found" | FIXED — unified to identical response |

---

## Security Audit

### CRITICAL

| ID | Finding | Evidence | Status |
|---|---|---|---|
| SEC-1 | No CORS on API gateway — cross-origin browser requests blocked | No `Access-Control-Allow-Origin` header in any response | OPEN |
| SEC-2 | All backend service ports exposed to host (3001-3007, 6379) | docker-compose.yml `ports:` on every service | OPEN |
| SEC-3 | Redis has no password — any container/host can access OTP data | `redis-cli ping` → PONG without auth | OPEN |
| SEC-4 | Weak default JWT secret (`automart-docker-secret`) committed to repo | docker-compose.yml:36 | OPEN |

### HIGH

| ID | Finding | Evidence | Status |
|---|---|---|---|
| SEC-5 | No Helmet/security headers — `X-Powered-By: Express` leaks server info, missing CSP/HSTS/X-Frame-Options | Header inspection | OPEN |
| SEC-6 | No per-endpoint rate limiting on `/login`, `/otp/send`, `/password/forgot` | Only global 100 req/15min at gateway | OPEN |
| SEC-7 | No JWT revocation / logout mechanism — tokens valid 7 days, no invalidation | auth-service: all endpoints `expiresIn: '7d'` | OPEN |
| SEC-8 | OTP verify unauthenticated — anyone can create accounts for any phone | auth-service: no `verifyToken()` on `/otp/verify` | OPEN |
| SEC-9 | Login password validation too weak: `min(1)` vs registration `min(8)` | auth-service:65 | OPEN |

### LOW

| ID | Finding | Evidence | Status |
|---|---|---|---|
| SEC-10 | Dev OTP code in response body (`devCode`) — risk if deployed without `NODE_ENV=production` | auth-service:481,623 | OPEN |
| SEC-11 | JWT stored in `localStorage` — accessible to XSS; HttpOnly cookie safer | login/page.tsx:97,126,160,226 | OPEN |
| SEC-12 | No HTTPS enforcement — no HSTS header, no TLS termination | Header inspection | OPEN |

---

## Recommendations

### Immediate (Before Production)

1. **Add CORS** — install `cors` package, configure allowed origins for `localhost:3080` (dev) and production domain
2. **Add Helmet** — install `helmet`, apply to gateway for security headers
3. **Restrict Redis** — add `requirepass` to Redis, update all service `REDIS_URL` env vars
4. **Remove internal port mappings** — only expose gateway (3000) and web (3080) to host
5. **Rotate JWT secret** — generate random 256-bit secret, store in `.env.docker` (not committed)
6. **Add per-endpoint rate limits** — stricter limits on auth endpoints (e.g., 10 req/15min for login)

### Before v1.0 Launch

7. **Implement JWT refresh tokens** — short-lived access tokens (15min) + refresh tokens
8. **Add auth to OTP verify** — require JWT for phone verification
9. **Strengthen login password validation** — enforce `min(8)` on login too
10. **Move JWT to HttpOnly cookie** — prevents XSS token theft
11. **Add CSP header** — Content-Security-Policy to prevent XSS
