/**
 * Auth Service — handles user registration, login, OTP verification, and profile retrieval.
 * Uses bcrypt for password hashing (12 rounds) and JWT for session tokens.
 * OTP flow: generate 6-digit code → store in Redis (5min TTL) → verify → issue JWT.
 * In dev mode, OTP is logged to console (no SMS provider needed).
 */
import express from 'express'
import { PrismaClient } from '../src/generated/auth'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import Redis from 'ioredis'

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.AUTH_SERVICE_PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

// ─── Redis connection (for OTP storage) ───────────────────────────────────────
const redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379', {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    return Math.min(times * 200, 3000)
  },
})

redis.on('connect', () => console.log('[Auth] Redis connected'))
redis.on('error', (err) => console.error('[Auth] Redis error:', err.message))

app.use(express.json())

// ─── Error response helper ──────────────────────────────────────────────────────
function errorResponse(res: express.Response, status: number, code: string, message: string, hint?: string) {
  return res.status(status).json({ code, message, ...(hint ? { hint } : {}) })
}

// ─── Schemas ────────────────────────────────────────────────────────────────────
// Zod schemas enforce input shape and types before any DB work happens.
// role defaults to 'individual' — mechanics and shops must opt-in explicitly.
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
// Creates a new user account. Checks for duplicate email first, then
// hashes the password with bcrypt (12 salt rounds) before storing.
// Returns a JWT token so the user is immediately authenticated.
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

    // JWT payload includes user ID and role — both needed by downstream services
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
// Authenticates a user by email + password. Uses the same error code
// for both "user not found" and "wrong password" to prevent email enumeration.
app.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { email: data.email } })
    if (!user) {
      return errorResponse(res, 401, 'AUTH_INVALID_CREDENTIALS',
        `No account found with email "${data.email}".`,
        'Check your email address or register a new account.')
    }

    // Compare password against bcrypt hash — timing-safe comparison
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

// ─── OTP Schemas ──────────────────────────────────────────────────────────────
const otpSendSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits').regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number format'),
})

const otpVerifySchema = z.object({
  phone: z.string().min(10, 'Phone number is required'),
  code: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d{6}$/, 'OTP must be numeric'),
})

// ─── POST /otp/send ───────────────────────────────────────────────────────────
// Generates a 6-digit OTP, stores it in Redis with 5-minute TTL.
// In dev mode, the OTP is logged to console (read from docker logs).
// In production, this would call an SMS provider (Twilio, Vonage, etc.)
app.post('/otp/send', async (req, res) => {
  try {
    const { phone } = otpSendSchema.parse(req.body)

    // Generate 6-digit OTP (zero-padded)
    const code = String(Math.floor(100000 + Math.random() * 900000))

    // Store in Redis with 5-minute TTL
    // Key format: otp:<phone> → stores JSON { code, attempts: 0, createdAt }
    const redisKey = `otp:${phone.replace(/[^+\d]/g, '')}`
    await redis.setex(redisKey, 300, JSON.stringify({
      code,
      attempts: 0,
      createdAt: new Date().toISOString(),
    }))

    // DEV MODE: Log OTP to console (read from `docker compose logs auth-service`)
    console.log(`\n${'═'.repeat(50)}`)
    console.log(`[OTP] Phone: ${phone}`)
    console.log(`[OTP] Code:  ${code}`)
    console.log(`[OTP] Valid: 5 minutes`)
    console.log(`${'═'.repeat(50)}\n`)

    res.json({
      success: true,
      message: `OTP sent to ${phone}`,
      // In dev mode, include OTP in response so frontend can auto-fill
      // Remove this in production!
      ...(process.env.NODE_ENV !== 'production' && { devCode: code }),
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.errors.map(e => e.message).join('; ')
      return errorResponse(res, 400, 'AUTH_INVALID_INPUT',
        `OTP send validation failed: ${messages}`,
        'Provide a valid phone number (10+ digits).')
    }
    console.error('[Auth] OTP send error:', err)
    return errorResponse(res, 500, 'AUTH_OTP_SEND_FAILED',
      'Failed to send OTP. The service may be temporarily unavailable.',
      'Try again in a moment.')
  }
})

// ─── POST /otp/verify ─────────────────────────────────────────────────────────
// Verifies the OTP code against Redis. On success, finds or creates the user
// by phone number and returns a JWT token (same as login flow).
// Max 3 verification attempts before OTP expires.
app.post('/otp/verify', async (req, res) => {
  try {
    const { phone, code } = otpVerifySchema.parse(req.body)
    const redisKey = `otp:${phone.replace(/[^+\d]/g, '')}`

    // Read OTP from Redis
    const stored = await redis.get(redisKey)
    if (!stored) {
      return errorResponse(res, 400, 'AUTH_OTP_EXPIRED',
        `No OTP found for "${phone}". The code may have expired (5-minute limit).`,
        'Request a new OTP via POST /api/auth/otp/send.')
    }

    const otpData = JSON.parse(stored)

    // Check attempt limit (max 3 tries)
    if (otpData.attempts >= 3) {
      await redis.del(redisKey)
      return errorResponse(res, 429, 'AUTH_OTP_MAX_ATTEMPTS',
        'Too many failed attempts. The OTP has been invalidated.',
        'Request a new OTP via POST /api/auth/otp/send.')
    }

    // Increment attempts
    otpData.attempts += 1
    await redis.setex(redisKey, 300, JSON.stringify(otpData))

    // Verify code
    if (otpData.code !== code) {
      return errorResponse(res, 401, 'AUTH_OTP_INVALID',
        `Incorrect OTP code. ${3 - otpData.attempts} attempts remaining.`,
        'Check the code sent to your phone and try again.')
    }

    // OTP valid — delete from Redis (one-time use)
    await redis.del(redisKey)

    // Find or create user by phone number
    const cleanPhone = phone.replace(/[^+\d]/g, '')
    let user = await prisma.user.findFirst({
      where: { email: `${cleanPhone}@otp.automart.local` },
      select: { id: true, name: true, email: true, role: true },
    })

    if (!user) {
      // Auto-create account for OTP users
      user = await prisma.user.create({
        data: {
          name: `User ${cleanPhone.slice(-4)}`,
          email: `${cleanPhone}@otp.automart.local`,
          password: await bcrypt.hash(`otp_${Date.now()}`, 12), // dummy password
          role: 'individual',
        },
        select: { id: true, name: true, email: true, role: true },
      })
    }

    // Issue JWT
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })

    console.log(`[OTP] Phone ${phone} verified → user ${user.id}`)

    res.json({ token, user })
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.errors.map(e => e.message).join('; ')
      return errorResponse(res, 400, 'AUTH_INVALID_INPUT',
        `OTP verify validation failed: ${messages}`,
        'Provide a valid phone number and a 6-digit numeric code.')
    }
    console.error('[Auth] OTP verify error:', err)
    return errorResponse(res, 500, 'AUTH_OTP_VERIFY_FAILED',
      'Failed to verify OTP. The service may be temporarily unavailable.',
      'Try again in a moment.')
  }
})

// ─── POST /otp/resend ─────────────────────────────────────────────────────────
// Deletes existing OTP and sends a fresh one. Convenience wrapper.
app.post('/otp/resend', async (req, res) => {
  try {
    const { phone } = otpSendSchema.parse(req.body)
    const cleanPhone = phone.replace(/[^+\d]/g, '')
    const redisKey = `otp:${cleanPhone}`

    // Delete existing OTP
    await redis.del(redisKey)

    // Generate new OTP
    const code = String(Math.floor(100000 + Math.random() * 900000))
    await redis.setex(redisKey, 300, JSON.stringify({
      code,
      attempts: 0,
      createdAt: new Date().toISOString(),
    }))

    console.log(`\n${'═'.repeat(50)}`)
    console.log(`[OTP RESEND] Phone: ${phone}`)
    console.log(`[OTP RESEND] Code:  ${code}`)
    console.log(`[OTP RESEND] Valid: 5 minutes`)
    console.log(`${'═'.repeat(50)}\n`)

    res.json({
      success: true,
      message: `New OTP sent to ${phone}`,
      ...(process.env.NODE_ENV !== 'production' && { devCode: code }),
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.errors.map(e => e.message).join('; ')
      return errorResponse(res, 400, 'AUTH_INVALID_INPUT',
        `OTP resend validation failed: ${messages}`,
        'Provide a valid phone number (10+ digits).')
    }
    console.error('[Auth] OTP resend error:', err)
    return errorResponse(res, 500, 'AUTH_OTP_RESEND_FAILED',
      'Failed to resend OTP. The service may be temporarily unavailable.',
      'Try again in a moment.')
  }
})

// ─── GET /me ────────────────────────────────────────────────────────────────────
// Returns the profile for the authenticated user. This endpoint
// verifies the JWT itself (not relying on gateway middleware) so
// it can be called directly by internal services as well.
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
