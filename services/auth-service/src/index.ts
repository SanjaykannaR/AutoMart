import express from 'express'
import { PrismaClient } from '../src/generated/auth'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.AUTH_SERVICE_PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

app.use(express.json())

// ─── Error response helper ──────────────────────────────────────────────────────
function errorResponse(res: express.Response, status: number, code: string, message: string, hint?: string) {
  return res.status(status).json({ code, message, ...(hint ? { hint } : {}) })
}

// ─── Schemas ────────────────────────────────────────────────────────────────────
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format — must be like user@example.com'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['mechanic', 'individual', 'shop']).default('individual'),
})

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

// ─── POST /register ─────────────────────────────────────────────────────────────
app.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body)

    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      return errorResponse(res, 409, 'AUTH_EMAIL_TAKEN',
        `An account already exists with email "${data.email}".`,
        'Try logging in instead, or use a different email address.')
    }

    const hashed = await bcrypt.hash(data.password, 12)
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, password: hashed, role: data.role },
    })

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.errors.map(e => e.message).join('; ')
      return errorResponse(res, 400, 'AUTH_INVALID_INPUT',
        `Registration validation failed: ${messages}`,
        'Check that name is 2+ chars, email is valid, and password is 8+ characters.')
    }
    console.error('[Auth] Registration error:', err)
    return errorResponse(res, 500, 'AUTH_REGISTRATION_FAILED',
      'An unexpected error occurred during registration. The database may be unavailable.',
      'Check the auth-service logs and verify the database is running.')
  }
})

// ─── POST /login ────────────────────────────────────────────────────────────────
app.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { email: data.email } })
    if (!user) {
      return errorResponse(res, 401, 'AUTH_INVALID_CREDENTIALS',
        `No account found with email "${data.email}".`,
        'Check your email address or register a new account.')
    }

    const valid = await bcrypt.compare(data.password, user.password)
    if (!valid) {
      return errorResponse(res, 401, 'AUTH_INVALID_CREDENTIALS',
        `Incorrect password for "${data.email}".`,
        'Double-check your password. If you forgot it, there is no reset flow yet — contact support.')
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.errors.map(e => e.message).join('; ')
      return errorResponse(res, 400, 'AUTH_INVALID_INPUT',
        `Login validation failed: ${messages}`,
        'Ensure email is valid and password is not empty.')
    }
    console.error('[Auth] Login error:', err)
    return errorResponse(res, 500, 'AUTH_LOGIN_FAILED',
      'An unexpected error occurred during login. The database may be unavailable.',
      'Check the auth-service logs and verify the database is running.')
  }
})

// ─── GET /me ────────────────────────────────────────────────────────────────────
app.get('/me', async (req, res) => {
  try {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
      return errorResponse(res, 401, 'AUTH_NO_TOKEN',
        'No authorization token provided. The request is missing the "Authorization: Bearer <token>" header.',
        'Include a valid JWT token in the Authorization header.')
    }

    const token = header.split(' ')[1]
    if (!token) {
      return errorResponse(res, 401, 'AUTH_EMPTY_TOKEN',
        'Authorization header is present but the token is empty.',
        'Include the full JWT token after "Bearer ".')
    }

    let decoded: { id: string }
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string }
    } catch (jwtErr: any) {
      if (jwtErr.name === 'TokenExpiredError') {
        return errorResponse(res, 401, 'AUTH_TOKEN_EXPIRED',
          'Your session has expired. The JWT token is no longer valid.',
          'Please log in again to get a fresh token.')
      }
      return errorResponse(res, 401, 'AUTH_TOKEN_INVALID',
        'The JWT token is malformed or was signed with a different secret.',
        'Make sure you are using the exact token from the login/register response.')
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true },
    })
    if (!user) {
      return errorResponse(res, 404, 'AUTH_USER_NOT_FOUND',
        `User with ID "${decoded.id}" no longer exists in the database.`,
        'The account may have been deleted. Please register again.')
    }

    res.json(user)
  } catch (err) {
    console.error('[Auth] /me error:', err)
    return errorResponse(res, 500, 'AUTH_SERVER_ERROR',
      'An unexpected error occurred while fetching user profile.',
      'Check auth-service logs for details.')
  }
})

// ─── Health ─────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'auth-service' }))

app.listen(PORT, () => {
  console.log(`[Auth Service] running on port ${PORT}`)
})
