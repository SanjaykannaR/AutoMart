/**
 * Turnstile human-verification middleware (Cloudflare).
 *
 * Protects sensitive auth endpoints (login, register, OTP send, admin login)
 * against credential stuffing, brute force, and SMS-bombing bots.
 *
 * Design notes:
 *  - The widget token is passed in the `X-Turnstile-Token` HEADER, not the body,
 *    so this middleware never consumes the request body — the proxy downstream
 *    still forwards the original payload untouched (the gateway deliberately
 *    avoids express.json() for this reason).
 *  - If TURNSTILE_SECRET_KEY is unset (local dev, CI, e2e tests) verification
 *    is skipped entirely — the feature is opt-in via config, so nothing breaks
 *    in environments without keys.
 *  - When a key IS set, verification FAILS CLOSED: missing/invalid tokens and
 *    siteverify network errors all reject the request. This is intentional —
 *    a broken captcha check must never silently let bots through.
 */
import type { NextFunction, Request, Response } from 'express'

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const TOKEN_HEADER = 'x-turnstile-token'

/** Verifies a Turnstile client token with Cloudflare's siteverify API. */
async function verifyToken(token: string, remoteIp?: string): Promise<boolean> {
  const params = new URLSearchParams({
    secret: process.env.TURNSTILE_SECRET_KEY || '',
    response: token,
  })
  if (remoteIp) params.set('remoteip', remoteIp)

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    })
    if (!res.ok) return false
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch (err) {
    console.error('[Gateway] Turnstile siteverify error:', err)
    return false
  }
}

export function turnstileMiddleware(req: Request, res: Response, next: NextFunction) {
  // Dev/CI mode: no secret configured → skip verification (feature opt-in).
  if (!process.env.TURNSTILE_SECRET_KEY) return next()

  const token = req.header(TOKEN_HEADER)
  if (!token) {
    return res.status(400).json({
      code: 'TURNSTILE_REQUIRED',
      message: 'Human verification is required for this action.',
      hint: 'Complete the Turnstile check on the page and try again.',
    })
  }

  verifyToken(token, req.ip).then((ok) => {
    if (!ok) {
      return res.status(403).json({
        code: 'TURNSTILE_VERIFY_FAILED',
        message: 'Human verification failed. Please try again.',
        hint: 'Refresh the Turnstile check and try again.',
      })
    }
    next()
  })
}
