/**
 * api.ts — Authenticated fetch helper
 *
 * Reads the JWT from localStorage("token") and attaches the
 * Authorization header. Returns null if not logged in.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

/** Get the stored JWT token, or null if not logged in. */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

/**
 * Authenticated fetch — wraps fetch with the Bearer token.
 * Returns null if no token exists (user not logged in).
 * Throws on non-OK responses.
 */
export async function authFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response | null> {
  const token = getToken()
  if (!token) return null

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `API error ${res.status}`)
  }

  return res
}
