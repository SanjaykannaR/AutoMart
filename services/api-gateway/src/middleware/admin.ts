/**
 * Admin-only auth middleware for the API gateway.
 *
 * SECURITY: Write operations on the product catalog (create/update/delete)
 * were previously reachable WITHOUT any authentication, letting anyone add,
 * edit, or remove products. This middleware requires a valid JWT whose role
 * is exactly 'admin' before the request is proxied to the product service.
 *
 * It reuses the same JWT verification logic as authMiddleware but adds a
 * role check. Role is read from the verified token (never from client input).
 */
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

/** Extends Express Request to carry the decoded JWT payload. */
export interface AdminRequest extends Request {
  user?: { id: string; role: string }
}

/**
 * Middleware that (1) verifies the Bearer JWT, then (2) rejects the request
 * unless the verified token belongs to an 'admin' user. Any other role —
 * or a missing/invalid token — gets a 403/401.
 */
export function adminMiddleware(req: AdminRequest, res: Response, next: NextFunction) {
  // ── SECURITY (SEC-AUTHZ-1): verify the JWT first ──
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 'ADMIN_AUTH_NO_TOKEN',
      message: 'No valid Authorization header provided. This write operation requires an admin token.',
      hint: 'Include "Authorization: Bearer <token>" from POST /api/auth/admin/login.',
    })
  }

  const token = header.split(' ')[1]
  if (!token) {
    return res.status(401).json({
      code: 'ADMIN_AUTH_EMPTY_TOKEN',
      message: 'Authorization header starts with "Bearer " but no token follows.',
      hint: 'Log in as an admin and provide the returned token.',
    })
  }

  try {
    if (!JWT_SECRET) {
      // Fail closed: without a JWT secret the server cannot safely verify
      // an admin token, so refuse rather than allow unauthenticated writes.
      return res.status(500).json({
        code: 'ADMIN_SERVER_MISCONFIGURED',
        message: 'JWT_SECRET environment variable is not set. Server cannot verify admin tokens.',
        hint: 'Set JWT_SECRET in your environment variables.',
      })
    }

    // Decode and verify. jwt.verify throws if the token is malformed/expired.
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string }
    req.user = decoded

    // ── SECURITY (SEC-AUTHZ-2): enforce the admin role ──
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        code: 'ADMIN_FORBIDDEN',
        message: 'Forbidden. Only admin accounts can perform this write operation.',
        hint: 'This endpoint manages the product catalog; log in via the admin panel.',
      })
    }

    next()
  } catch (err: any) {
    // Invalid/expired token → deny access.
    return res.status(401).json({
      code: 'ADMIN_AUTH_TOKEN_INVALID',
      message: err.name === 'TokenExpiredError'
        ? 'Your admin session has expired. Log in again.'
        : 'The admin token is invalid or was signed with a different secret.',
      hint: 'Log in again via POST /api/auth/admin/login to get a fresh token.',
    })
  }
}