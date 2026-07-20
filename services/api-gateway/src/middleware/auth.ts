import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export interface AuthRequest extends Request {
  user?: { id: string; role: string }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization

  if (!header) {
    return res.status(401).json({
      code: 'AUTH_NO_TOKEN',
      message: 'No Authorization header provided. This endpoint requires authentication.',
      hint: 'Include "Authorization: Bearer <token>" in your request headers. Get a token from POST /api/auth/login.',
    })
  }

  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 'AUTH_MALFORMED_HEADER',
      message: 'Authorization header must use "Bearer" scheme. The header is present but does not start with "Bearer ".',
      hint: 'Use the format: Authorization: Bearer <your-jwt-token>',
    })
  }

  const token = header.split(' ')[1]
  if (!token) {
    return res.status(401).json({
      code: 'AUTH_EMPTY_TOKEN',
      message: 'Authorization header starts with "Bearer " but no token follows.',
      hint: 'Include the full JWT token after "Bearer ". Get a token from POST /api/auth/login.',
    })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string }
    req.user = decoded
    next()
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 'AUTH_TOKEN_EXPIRED',
        message: 'Your session has expired. The JWT token is no longer valid.',
        hint: 'Log in again via POST /api/auth/login to get a fresh token.',
      })
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        code: 'AUTH_TOKEN_INVALID',
        message: 'The JWT token is malformed or was signed with a different secret.',
        hint: 'Use the exact token returned by the login/register response. Do not modify it.',
      })
    }
    return res.status(401).json({
      code: 'AUTH_TOKEN_ERROR',
      message: `Token verification failed: ${err.message}`,
      hint: 'Log in again to get a fresh token.',
    })
  }
}
