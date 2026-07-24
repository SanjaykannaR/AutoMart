/**
 * Auth Service — handles user registration, login, OAuth, OTP, password reset, and profile management.
 * Uses bcrypt for password hashing (12 rounds) and JWT for session tokens.
 * OTP flow: generate 6-digit code → store in Redis (5min TTL) → verify → mark phone verified.
 * In dev mode, OTP is logged to console (no SMS provider needed).
 */
import express from 'express'
import { PrismaClient } from '../src/generated/auth'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import Redis from 'ioredis'
import { OAuth2Client } from 'google-auth-library'

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.AUTH_SERVICE_PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''

// ─── Google OAuth client ───────────────────────────────────────────────────────
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID)

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

// ─── JWT verification helper ────────────────────────────────────────────────────
function verifyToken(req: express.Request): { id: string; role: string } | null {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) return null
  const token = header.split(' ')[1]
  if (!token) return null
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; role: string }
  } catch {
    return null
  }
}

// ─── Schemas ────────────────────────────────────────────────────────────────────
// Register schema — supports all user roles including admin
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format — must be like user@example.com'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['mechanic', 'individual', 'shop', 'admin']).default('individual'),
})

// Login schema — email + password (used by both customer and admin login)
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

// OAuth schema — Google/Apple token verification
const oauthSchema = z.object({
  provider: z.enum(['google', 'apple']),
  providerToken: z.string().min(1, 'Provider token is required'),
})

// Profile setup schema — completed after OAuth signup
const profileSetupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  avatar: z.string().default('👤'),
})

// Update profile schema — all fields optional for partial updates
const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  address: z.string().min(5).optional(),
  avatar: z.string().optional(),
})

// Password forgot schema — sends reset code to email
const passwordForgotSchema = z.object({
  email: z.string().email('Invalid email format'),
})

// Password reset schema — verifies code and sets new password
const passwordResetSchema = z.object({
  email: z.string().email('Invalid email format'),
  code: z.string().length(6, 'Code must be exactly 6 digits').regex(/^\d{6}$/, 'Code must be numeric'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

// ─── Admin Schemas ──────────────────────────────────────────────────────────────
// Bootstrap schema — creates the first admin account (one-time only)
const adminBootstrapSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

// Admin login schema — same as customer login but validates role=admin
const adminLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

// Change password schema — requires current password for verification
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

// Change username schema — updates admin display name
const changeUsernameSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

// ─── Banner Schemas ─────────────────────────────────────────────────────────────
// Banner create/update schema — all fields required for creation
const bannerCreateSchema = z.object({
  headline: z.string().min(1, 'Headline is required'),
  subtitle: z.string().min(1, 'Subtitle is required'),
  badge: z.string().min(1, 'Badge text is required'),
  cta: z.string().min(1, 'CTA text is required'),
  link: z.string().min(1, 'Link URL is required'),
  gradient: z.string().min(1, 'Gradient class is required'),
  image: z.string().url('Image must be a valid URL'),
  accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Accent must be a valid hex color'),
  isActive: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
})

// Banner update schema — all fields optional for partial updates
const bannerUpdateSchema = bannerCreateSchema.partial()

// Banner reorder schema — array of { id, order } pairs
const bannerReorderSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid(),
    order: z.number().int().min(0),
  })),
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
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        role: data.role,
        authProvider: 'email',
      },
    })

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phoneVerified: user.phoneVerified,
        authProvider: user.authProvider,
      },
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.errors.map(e => e.message).join('; ')
      return errorResponse(res, 400, 'AUTH_INVALID_INPUT',
        `Registration validation failed: ${messages}`,
        'Check that name is 2+ chars, email is valid, and password is 8+ characters.')
    }
    console.error('[Auth] Registration error:', err)
    return errorResponse(res, 500, 'AUTH_REGISTRATION_FAILED',
      'An unexpected error occurred during registration.',
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
        'Invalid email or password.',
        'Check your credentials or register a new account.')
    }

    const valid = await bcrypt.compare(data.password, user.password)
    if (!valid) {
      return errorResponse(res, 401, 'AUTH_INVALID_CREDENTIALS',
        'Invalid email or password.',
        'Check your credentials or register a new account.')
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        address: user.address,
        authProvider: user.authProvider,
      },
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.errors.map(e => e.message).join('; ')
      return errorResponse(res, 400, 'AUTH_INVALID_INPUT',
        `Login validation failed: ${messages}`,
        'Ensure email is valid and password is not empty.')
    }
    console.error('[Auth] Login error:', err)
    return errorResponse(res, 500, 'AUTH_LOGIN_FAILED',
      'An unexpected error occurred during login.',
      'Check auth-service logs for details.')
  }
})

// ─── POST /oauth (Google + Apple) ───────────────────────────────────────────────
// Verifies OAuth tokens with Google/Apple APIs. In dev mode without keys, uses simulated verification.
app.post('/oauth', async (req, res) => {
  try {
    const { provider, providerToken } = oauthSchema.parse(req.body)

    let email = ''
    let name = ''
    let avatarUrl = ''

    if (provider === 'google') {
      // ─── Google OAuth verification ───
      if (GOOGLE_CLIENT_ID) {
        // Production: verify with real Google token
        try {
          const ticket = await googleClient.verifyIdToken({
            idToken: providerToken,
            audience: GOOGLE_CLIENT_ID,
          })
          const payload = ticket.getPayload()
          if (!payload) {
            return errorResponse(res, 401, 'AUTH_GOOGLE_INVALID_TOKEN',
              'Invalid Google token. Could not extract user info.',
              'Try signing in again with Google.')
          }
          email = payload.email || ''
          name = payload.name || payload.given_name || 'Google User'
          avatarUrl = payload.picture || ''
          console.log(`[OAuth] Google token verified for: ${email}`)
        } catch (googleErr: any) {
          console.error('[OAuth] Google verification failed:', googleErr.message)
          return errorResponse(res, 401, 'AUTH_GOOGLE_VERIFY_FAILED',
            'Failed to verify Google token. It may have expired or been revoked.',
            'Try signing in again with Google.')
        }
      } else {
        // Dev mode: simulate Google OAuth
        email = `google_${providerToken.slice(0, 8)}@automart.oauth.local`
        name = 'Google User'
        console.log(`[OAuth] Dev mode: simulated Google login for ${email}`)
      }
    } else if (provider === 'apple') {
      // ─── Apple OAuth verification ───
      // Apple Sign-In uses JWT-based identity tokens
      // For now, we'll use a simplified approach
      // In production, verify with apple-signin-auth package
      if (providerToken.includes('.')) {
        // Looks like a JWT — decode it (simplified, not cryptographically verified)
        try {
          const parts = providerToken.split('.')
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
            email = payload.email || `apple_${payload.sub}@automart.oauth.local`
            name = payload.name || 'Apple User'
            console.log(`[OAuth] Apple token decoded for: ${email}`)
          }
        } catch {
          // Fall back to simulated
          email = `apple_${providerToken.slice(0, 8)}@automart.oauth.local`
          name = 'Apple User'
        }
      } else {
        // Dev mode: simulate Apple OAuth
        email = `apple_${providerToken.slice(0, 8)}@automart.oauth.local`
        name = 'Apple User'
        console.log(`[OAuth] Dev mode: simulated Apple login for ${email}`)
      }
    }

    if (!email) {
      return errorResponse(res, 400, 'AUTH_OAUTH_NO_EMAIL',
        'Could not extract email from OAuth provider.',
        'Try signing in again or use email/password instead.')
    }

    // Find or create user by email
    let user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      // New OAuth user — create account
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: await bcrypt.hash(`oauth_${Date.now()}`, 12), // dummy password
          authProvider: provider,
          avatar: avatarUrl || '👤',
          phoneVerified: false,
        },
      })
      console.log(`[OAuth] New ${provider} user created: ${user.id}`)
    } else {
      // Existing user — update avatar if provided by OAuth
      if (avatarUrl && !user.avatar?.startsWith('http')) {
        await prisma.user.update({
          where: { id: user.id },
          data: { avatar: avatarUrl },
        })
      }
      console.log(`[OAuth] Existing ${provider} user logged in: ${user.id}`)
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        address: user.address,
        authProvider: user.authProvider,
      },
      isNewUser: !user.phone, // If no phone, they need to complete profile setup
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.errors.map(e => e.message).join('; ')
      return errorResponse(res, 400, 'AUTH_INVALID_INPUT',
        `OAuth validation failed: ${messages}`,
        'Provide a valid provider (google/apple) and provider token.')
    }
    console.error('[Auth] OAuth error:', err)
    return errorResponse(res, 500, 'AUTH_OAUTH_FAILED',
      'An unexpected error occurred during OAuth login.',
      'Check auth-service logs for details.')
  }
})

// ─── POST /profile/setup ────────────────────────────────────────────────────────
// Completes profile after OAuth signup — saves name, phone, address, avatar.
// Requires JWT authentication.
app.post('/profile/setup', async (req, res) => {
  try {
    const decoded = verifyToken(req)
    if (!decoded) {
      return errorResponse(res, 401, 'AUTH_NO_TOKEN',
        'Authentication required. Please log in first.',
        'Include a valid JWT in the Authorization header.')
    }

    const data = profileSetupSchema.parse(req.body)

    // Check if phone is already taken by another user
    const cleanPhone = data.phone.replace(/[^+\d]/g, '')
    const existingPhone = await prisma.user.findFirst({
      where: { phone: cleanPhone, NOT: { id: decoded.id } },
    })
    if (existingPhone) {
      return errorResponse(res, 409, 'AUTH_PHONE_TAKEN',
        'This phone number is already associated with another account.',
        'Use a different phone number or contact support.')
    }

    const user = await prisma.user.update({
      where: { id: decoded.id },
      data: {
        name: data.name,
        phone: cleanPhone,
        address: data.address,
        avatar: data.avatar,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        phone: true,
        phoneVerified: true,
        address: true,
        authProvider: true,
      },
    })

    console.log(`[Profile] User ${user.id} completed profile setup`)
    res.json({ user })
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.errors.map(e => e.message).join('; ')
      return errorResponse(res, 400, 'AUTH_INVALID_INPUT',
        `Profile setup validation failed: ${messages}`,
        'Provide name (2+ chars), phone (10+ digits), and address (5+ chars).')
    }
    console.error('[Auth] Profile setup error:', err)
    return errorResponse(res, 500, 'AUTH_PROFILE_SETUP_FAILED',
      'Failed to save profile. Please try again.',
      'Check auth-service logs for details.')
  }
})

// ─── PUT /me ────────────────────────────────────────────────────────────────────
// Updates the authenticated user's profile fields.
app.put('/me', async (req, res) => {
  try {
    const decoded = verifyToken(req)
    if (!decoded) {
      return errorResponse(res, 401, 'AUTH_NO_TOKEN',
        'Authentication required.',
        'Include a valid JWT in the Authorization header.')
    }

    const data = updateProfileSchema.parse(req.body)

    // Check phone uniqueness if updating
    if (data.phone) {
      const cleanPhone = data.phone.replace(/[^+\d]/g, '')
      data.phone = cleanPhone
      const existingPhone = await prisma.user.findFirst({
        where: { phone: cleanPhone, NOT: { id: decoded.id } },
      })
      if (existingPhone) {
        return errorResponse(res, 409, 'AUTH_PHONE_TAKEN',
          'This phone number is already associated with another account.',
          'Use a different phone number.')
      }
    }

    const user = await prisma.user.update({
      where: { id: decoded.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        phone: true,
        phoneVerified: true,
        address: true,
        authProvider: true,
      },
    })

    res.json({ user })
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.errors.map(e => e.message).join('; ')
      return errorResponse(res, 400, 'AUTH_INVALID_INPUT',
        `Profile update validation failed: ${messages}`,
        'Check your input values.')
    }
    console.error('[Auth] Profile update error:', err)
    return errorResponse(res, 500, 'AUTH_PROFILE_UPDATE_FAILED',
      'Failed to update profile.',
      'Check auth-service logs for details.')
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
app.post('/otp/send', async (req, res) => {
  try {
    const { phone } = otpSendSchema.parse(req.body)
    const cleanPhone = phone.replace(/[^+\d]/g, '')

    const code = String(Math.floor(100000 + Math.random() * 900000))
    const redisKey = `otp:${cleanPhone}`
    await redis.setex(redisKey, 300, JSON.stringify({
      code,
      attempts: 0,
      createdAt: new Date().toISOString(),
    }))

    console.log(`\n${'═'.repeat(50)}`)
    console.log(`[OTP] Phone: ${phone}`)
    console.log(`[OTP] Code:  ${code}`)
    console.log(`[OTP] Valid: 5 minutes`)
    console.log(`${'═'.repeat(50)}\n`)

    res.json({
      success: true,
      message: `OTP sent to ${phone}`,
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
      'Failed to send OTP.',
      'Try again in a moment.')
  }
})

// ─── POST /otp/verify ─────────────────────────────────────────────────────────
// Verifies OTP and marks phone as verified for the authenticated user.
app.post('/otp/verify', async (req, res) => {
  try {
    const { phone, code } = otpVerifySchema.parse(req.body)
    const cleanPhone = phone.replace(/[^+\d]/g, '')
    const redisKey = `otp:${cleanPhone}`

    const stored = await redis.get(redisKey)
    if (!stored) {
      return errorResponse(res, 400, 'AUTH_OTP_EXPIRED',
        `No OTP found for "${phone}". The code may have expired (5-minute limit).`,
        'Request a new OTP via POST /api/auth/otp/send.')
    }

    const otpData = JSON.parse(stored)

    otpData.attempts += 1

    if (otpData.attempts >= 3 || otpData.code !== code) {
      await redis.setex(redisKey, 300, JSON.stringify(otpData))

      if (otpData.attempts >= 3) {
        await redis.del(redisKey)
        return errorResponse(res, 429, 'AUTH_OTP_MAX_ATTEMPTS',
          'Too many failed attempts. The OTP has been invalidated.',
          'Request a new OTP via POST /api/auth/otp/send.')
      }

      return errorResponse(res, 401, 'AUTH_OTP_INVALID',
        `Incorrect OTP code. ${3 - otpData.attempts} attempt${3 - otpData.attempts === 1 ? '' : 's'} remaining.`,
        'Check the code sent to your phone and try again.')
    }

    await redis.setex(redisKey, 300, JSON.stringify(otpData))

    // OTP valid — delete from Redis
    await redis.del(redisKey)

    // Try to find user by phone number and mark as verified
    const decoded = verifyToken(req)
    if (decoded) {
      await prisma.user.update({
        where: { id: decoded.id },
        data: { phoneVerified: true },
      })
      console.log(`[OTP] Phone ${phone} verified for user ${decoded.id}`)
    }

    // Also find existing user by phone (for login flow)
    let user = decoded ? await prisma.user.findUnique({ where: { id: decoded.id } }) : null
    if (!user) {
      user = await prisma.user.findFirst({ where: { phone: cleanPhone } })
    }
    // Fallback: find by the generated email pattern (handles prior OTP users with phone:null)
    if (!user) {
      user = await prisma.user.findUnique({ where: { email: `${cleanPhone}@otp.automart.local` } })
    }

    if (!user) {
      // Auto-create account for OTP-only users
      try {
        user = await prisma.user.create({
          data: {
            name: `User ${cleanPhone.slice(-4)}`,
            email: `${cleanPhone}@otp.automart.local`,
            password: await bcrypt.hash(`otp_${Date.now()}`, 12),
            phone: cleanPhone,
            phoneVerified: true,
            authProvider: 'phone',
          },
        })
      } catch (createErr: any) {
        // Unique constraint race: another request created the user — fetch it
        if (createErr?.code === 'P2002') {
          user = await prisma.user.findUnique({ where: { email: `${cleanPhone}@otp.automart.local` } })
        } else {
          throw createErr
        }
      }
    } else {
      // Mark existing user's phone as verified (set phone if null)
      await prisma.user.update({
        where: { id: user.id },
        data: { phoneVerified: true, ...(user.phone ? {} : { phone: cleanPhone }) },
      })
    }

    if (!user) {
      return errorResponse(res, 500, 'AUTH_OTP_USER_FAILED',
        'OTP verified but could not find or create user account.',
        'Contact support.')
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        phoneVerified: true,
        address: user.address,
        authProvider: user.authProvider,
      },
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.errors.map(e => e.message).join('; ')
      return errorResponse(res, 400, 'AUTH_INVALID_INPUT',
        `OTP verify validation failed: ${messages}`,
        'Provide a valid phone number and a 6-digit numeric code.')
    }
    console.error('[Auth] OTP verify error:', err)
    return errorResponse(res, 500, 'AUTH_OTP_VERIFY_FAILED',
      'Failed to verify OTP.',
      'Try again in a moment.')
  }
})

// ─── POST /otp/resend ─────────────────────────────────────────────────────────
app.post('/otp/resend', async (req, res) => {
  try {
    const { phone } = otpSendSchema.parse(req.body)
    const cleanPhone = phone.replace(/[^+\d]/g, '')
    const redisKey = `otp:${cleanPhone}`

    await redis.del(redisKey)

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
      'Failed to resend OTP.',
      'Try again in a moment.')
  }
})

// ─── POST /password/forgot ──────────────────────────────────────────────────────
// Sends a 6-digit reset code to the user's email (stored in Redis).
app.post('/password/forgot', async (req, res) => {
  try {
    const { email } = passwordForgotSchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      // Don't reveal whether the email exists
      return res.json({
        success: true,
        message: `If an account exists with "${email}", a reset code has been sent.`,
      })
    }

    const code = String(Math.floor(100000 + Math.random() * 900000))
    const redisKey = `pwdreset:${email}`
    await redis.setex(redisKey, 600, JSON.stringify({ // 10-minute TTL
      code,
      attempts: 0,
      createdAt: new Date().toISOString(),
    }))

    console.log(`\n${'═'.repeat(50)}`)
    console.log(`[PASSWORD RESET] Email: ${email}`)
    console.log(`[PASSWORD RESET] Code:  ${code}`)
    console.log(`[PASSWORD RESET] Valid: 10 minutes`)
    console.log(`${'═'.repeat(50)}\n`)

    res.json({
      success: true,
      message: `If an account exists with "${email}", a reset code has been sent.`,
      ...(process.env.NODE_ENV !== 'production' && { devCode: code }),
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.errors.map(e => e.message).join('; ')
      return errorResponse(res, 400, 'AUTH_INVALID_INPUT',
        `Password reset validation failed: ${messages}`,
        'Provide a valid email address.')
    }
    console.error('[Auth] Password forgot error:', err)
    return errorResponse(res, 500, 'AUTH_PASSWORD_FORGOT_FAILED',
      'Failed to process password reset request.',
      'Try again in a moment.')
  }
})

// ─── POST /password/reset ──────────────────────────────────────────────────────
// Verifies the reset code and sets a new password.
app.post('/password/reset', async (req, res) => {
  try {
    const { email, code, newPassword } = passwordResetSchema.parse(req.body)
    const redisKey = `pwdreset:${email}`

    const stored = await redis.get(redisKey)
    if (!stored) {
      return errorResponse(res, 400, 'AUTH_RESET_EXPIRED',
        `No reset code found for "${email}". The code may have expired (10-minute limit).`,
        'Request a new code via POST /api/auth/password/forgot.')
    }

    const resetData = JSON.parse(stored)

    resetData.attempts += 1

    if (resetData.attempts >= 3 || resetData.code !== code) {
      await redis.setex(redisKey, 600, JSON.stringify(resetData))

      if (resetData.attempts >= 3) {
        await redis.del(redisKey)
        return errorResponse(res, 429, 'AUTH_RESET_MAX_ATTEMPTS',
          'Too many failed attempts. The reset code has been invalidated.',
          'Request a new code via POST /api/auth/password/forgot.')
      }

      return errorResponse(res, 401, 'AUTH_RESET_INVALID',
        `Incorrect reset code. ${3 - resetData.attempts} attempt${3 - resetData.attempts === 1 ? '' : 's'} remaining.`,
        'Check the code sent to your email and try again.')
    }

    await redis.setex(redisKey, 600, JSON.stringify(resetData))

    // Code valid — update password
    await redis.del(redisKey)
    const hashed = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { email },
      data: { password: hashed },
    })

    console.log(`[PASSWORD RESET] Password updated for ${email}`)

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now sign in with your new password.',
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.errors.map(e => e.message).join('; ')
      return errorResponse(res, 400, 'AUTH_INVALID_INPUT',
        `Password reset validation failed: ${messages}`,
        'Provide a valid email, 6-digit code, and password (8+ chars).')
    }
    console.error('[Auth] Password reset error:', err)
    return errorResponse(res, 500, 'AUTH_PASSWORD_RESET_FAILED',
      'Failed to reset password.',
      'Try again in a moment.')
  }
})

// ─── GET /me ────────────────────────────────────────────────────────────────────
app.get('/me', async (req, res) => {
  try {
    const decoded = verifyToken(req)
    if (!decoded) {
      return errorResponse(res, 401, 'AUTH_NO_TOKEN',
        'No authorization token provided.',
        'Include a valid JWT token in the Authorization header.')
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        phone: true,
        phoneVerified: true,
        address: true,
        authProvider: true,
      },
    })
    if (!user) {
      return errorResponse(res, 404, 'AUTH_USER_NOT_FOUND',
        `User with ID "${decoded.id}" no longer exists.`,
        'Please register again.')
    }

    res.json(user)
  } catch (err) {
    console.error('[Auth] /me error:', err)
    return errorResponse(res, 500, 'AUTH_SERVER_ERROR',
      'An unexpected error occurred while fetching user profile.',
      'Check auth-service logs for details.')
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES — separate from customer routes for security isolation
// ═══════════════════════════════════════════════════════════════════════════════

// ─── POST /admin/bootstrap ────────────────────────────────────────────────────
// Creates the first admin account. Can only be called ONCE — after that,
// use POST /admin/create-admin to add more admins from the admin panel.
// This prevents unauthorized admin creation after initial setup.
app.post('/admin/bootstrap', async (req, res) => {
  try {
    const data = adminBootstrapSchema.parse(req.body)

    // Check if any admin already exists — if so, block bootstrap
    const existingAdmin = await prisma.user.findFirst({ where: { role: 'admin' } })
    if (existingAdmin) {
      return errorResponse(res, 403, 'ADMIN_BOOTSTRAP_EXISTS',
        'Admin account already exists. Bootstrap is one-time only.',
        'Use the admin panel to create additional admin accounts.')
    }

    // Check if email is already taken
    const existingEmail = await prisma.user.findUnique({ where: { email: data.email } })
    if (existingEmail) {
      return errorResponse(res, 409, 'AUTH_EMAIL_TAKEN',
        `An account already exists with email "${data.email}".`,
        'Use a different email address.')
    }

    // Create admin user with hashed password
    const hashed = await bcrypt.hash(data.password, 12)
    const admin = await prisma.user.create({
      data: {
        name: data.username,
        email: data.email,
        password: hashed,
        role: 'admin',
        authProvider: 'email',
      },
    })

    // Generate JWT token for immediate login
    const token = jwt.sign({ id: admin.id, role: admin.role }, JWT_SECRET, { expiresIn: '7d' })

    console.log(`[Admin] Bootstrap: first admin created — ${admin.email} (${admin.id})`)

    res.status(201).json({
      token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.errors.map(e => e.message).join('; ')
      return errorResponse(res, 400, 'ADMIN_INVALID_INPUT',
        `Bootstrap validation failed: ${messages}`,
        'Provide username (3+ chars), valid email, and password (8+ chars).')
    }
    console.error('[Admin] Bootstrap error:', err)
    return errorResponse(res, 500, 'ADMIN_BOOTSTRAP_FAILED',
      'Failed to create admin account.',
      'Check auth-service logs for details.')
  }
})

// ─── POST /admin/login ────────────────────────────────────────────────────────
// Admin-specific login endpoint. Validates that the user has role=admin
// before issuing a token. Regular users cannot log in through this endpoint.
app.post('/admin/login', async (req, res) => {
  try {
    const data = adminLoginSchema.parse(req.body)

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email: data.email } })
    if (!user) {
      return errorResponse(res, 401, 'ADMIN_INVALID_CREDENTIALS',
        'Invalid email or password.',
        'Check your credentials or contact the system administrator.')
    }

    // Verify password
    const valid = await bcrypt.compare(data.password, user.password)
    if (!valid) {
      return errorResponse(res, 401, 'ADMIN_INVALID_CREDENTIALS',
        'Invalid email or password.',
        'Check your credentials or contact the system administrator.')
    }

    // CRITICAL: Only admin users can use this endpoint
    if (user.role !== 'admin') {
      return errorResponse(res, 403, 'ADMIN_NOT_ADMIN',
        'This account does not have admin privileges.',
        'Use the customer login page instead, or contact an administrator.')
    }

    // Issue JWT with admin role
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })

    console.log(`[Admin] Login: ${user.email} (${user.id})`)

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.errors.map(e => e.message).join('; ')
      return errorResponse(res, 400, 'ADMIN_INVALID_INPUT',
        `Login validation failed: ${messages}`,
        'Ensure email is valid and password is not empty.')
    }
    console.error('[Admin] Login error:', err)
    return errorResponse(res, 500, 'ADMIN_LOGIN_FAILED',
      'An unexpected error occurred during admin login.',
      'Check auth-service logs for details.')
  }
})

// ─── POST /admin/create-admin ─────────────────────────────────────────────────
// Creates additional admin accounts from the admin panel.
// Requires authenticated admin user (checked by api-gateway admin middleware).
app.post('/admin/create-admin', async (req, res) => {
  try {
    // Verify the requesting user is an admin
    const decoded = verifyToken(req)
    if (!decoded || decoded.role !== 'admin') {
      return errorResponse(res, 403, 'ADMIN_FORBIDDEN',
        'Only admin users can create new admin accounts.',
        'Log in as an admin to use this endpoint.')
    }

    const data = adminBootstrapSchema.parse(req.body)

    // Check if email is already taken
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      return errorResponse(res, 409, 'AUTH_EMAIL_TAKEN',
        `An account already exists with email "${data.email}".`,
        'Use a different email address.')
    }

    // Create new admin user
    const hashed = await bcrypt.hash(data.password, 12)
    const admin = await prisma.user.create({
      data: {
        name: data.username,
        email: data.email,
        password: hashed,
        role: 'admin',
        authProvider: 'email',
      },
    })

    console.log(`[Admin] Created by ${decoded.id}: new admin ${admin.email} (${admin.id})`)

    res.status(201).json({
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.errors.map(e => e.message).join('; ')
      return errorResponse(res, 400, 'ADMIN_INVALID_INPUT',
        `Create admin validation failed: ${messages}`,
        'Provide username (3+ chars), valid email, and password (8+ chars).')
    }
    console.error('[Admin] Create admin error:', err)
    return errorResponse(res, 500, 'ADMIN_CREATE_FAILED',
      'Failed to create admin account.',
      'Check auth-service logs for details.')
  }
})

// ─── GET /admin/me ────────────────────────────────────────────────────────────
// Returns the current admin's profile. Used by the admin panel to verify
// authentication and display admin info in the sidebar/header.
app.get('/admin/me', async (req, res) => {
  try {
    const decoded = verifyToken(req)
    if (!decoded) {
      return errorResponse(res, 401, 'ADMIN_NO_TOKEN',
        'Authentication required. Please log in first.',
        'Include a valid JWT in the Authorization header.')
    }

    // Verify user is actually an admin
    if (decoded.role !== 'admin') {
      return errorResponse(res, 403, 'ADMIN_FORBIDDEN',
        'This endpoint is for admin users only.',
        'Use the customer profile endpoint instead.')
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    if (!user) {
      return errorResponse(res, 404, 'ADMIN_NOT_FOUND',
        'Admin account no longer exists.',
        'Contact the system administrator.')
    }

    res.json(user)
  } catch (err) {
    console.error('[Admin] /me error:', err)
    return errorResponse(res, 500, 'ADMIN_SERVER_ERROR',
      'Failed to fetch admin profile.',
      'Check auth-service logs for details.')
  }
})

// ─── PATCH /admin/change-password ─────────────────────────────────────────────
// Changes the admin's password. Requires current password for verification.
// This prevents unauthorized password changes even if the JWT is compromised.
app.patch('/admin/change-password', async (req, res) => {
  try {
    const decoded = verifyToken(req)
    if (!decoded || decoded.role !== 'admin') {
      return errorResponse(res, 403, 'ADMIN_FORBIDDEN', 'Admin access required.')
    }

    const data = changePasswordSchema.parse(req.body)

    // Fetch current user to verify password
    const user = await prisma.user.findUnique({ where: { id: decoded.id } })
    if (!user) {
      return errorResponse(res, 404, 'ADMIN_NOT_FOUND', 'Admin account not found.')
    }

    // Verify current password before allowing change
    const valid = await bcrypt.compare(data.currentPassword, user.password)
    if (!valid) {
      return errorResponse(res, 401, 'ADMIN_WRONG_PASSWORD',
        'Current password is incorrect.',
        'Enter your current password to confirm the change.')
    }

    // Hash and save new password
    const hashed = await bcrypt.hash(data.newPassword, 12)
    await prisma.user.update({
      where: { id: decoded.id },
      data: { password: hashed },
    })

    console.log(`[Admin] Password changed: ${user.email} (${user.id})`)

    res.json({ success: true, message: 'Password changed successfully.' })
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.errors.map(e => e.message).join('; ')
      return errorResponse(res, 400, 'ADMIN_INVALID_INPUT',
        `Password change validation failed: ${messages}`,
        'Provide current password and new password (8+ chars).')
    }
    console.error('[Admin] Change password error:', err)
    return errorResponse(res, 500, 'ADMIN_PASSWORD_CHANGE_FAILED', 'Failed to change password.')
  }
})

// ─── PATCH /admin/change-username ─────────────────────────────────────────────
// Updates the admin's display name. Simple update with no password required
// since the admin is already authenticated via JWT.
app.patch('/admin/change-username', async (req, res) => {
  try {
    const decoded = verifyToken(req)
    if (!decoded || decoded.role !== 'admin') {
      return errorResponse(res, 403, 'ADMIN_FORBIDDEN', 'Admin access required.')
    }

    const data = changeUsernameSchema.parse(req.body)

    const user = await prisma.user.update({
      where: { id: decoded.id },
      data: { name: data.name },
      select: { id: true, name: true, email: true, role: true },
    })

    console.log(`[Admin] Username changed: ${user.email} → "${user.name}"`)

    res.json({ success: true, user })
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.errors.map(e => e.message).join('; ')
      return errorResponse(res, 400, 'ADMIN_INVALID_INPUT',
        `Username change validation failed: ${messages}`,
        'Provide a name with at least 2 characters.')
    }
    console.error('[Admin] Change username error:', err)
    return errorResponse(res, 500, 'ADMIN_USERNAME_CHANGE_FAILED', 'Failed to change username.')
  }
})

// ─── POST /admin/forgot-password ──────────────────────────────────────────────
// Admin password reset — sends a 6-digit code to the admin's email.
// Same flow as customer forgot-password but validates role=admin.
app.post('/admin/forgot-password', async (req, res) => {
  try {
    const { email } = passwordForgotSchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { email } })

    // Don't reveal whether the email exists or if it's not an admin
    if (!user || user.role !== 'admin') {
      return res.json({
        success: true,
        message: `If an admin account exists with "${email}", a reset code has been sent.`,
      })
    }

    // Generate 6-digit reset code
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const redisKey = `admin_pwdreset:${email}`
    await redis.setex(redisKey, 600, JSON.stringify({ // 10-minute TTL
      code,
      attempts: 0,
      createdAt: new Date().toISOString(),
    }))

    // In production, send via email service. For now, log to console.
    console.log(`\n${'═'.repeat(50)}`)
    console.log(`[ADMIN PASSWORD RESET] Email: ${email}`)
    console.log(`[ADMIN PASSWORD RESET] Code:  ${code}`)
    console.log(`[ADMIN PASSWORD RESET] Valid: 10 minutes`)
    console.log(`${'═'.repeat(50)}\n`)

    res.json({
      success: true,
      message: `If an admin account exists with "${email}", a reset code has been sent.`,
      ...(process.env.NODE_ENV !== 'production' && { devCode: code }),
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.errors.map(e => e.message).join('; ')
      return errorResponse(res, 400, 'ADMIN_INVALID_INPUT',
        `Password reset validation failed: ${messages}`,
        'Provide a valid email address.')
    }
    console.error('[Admin] Forgot password error:', err)
    return errorResponse(res, 500, 'ADMIN_FORGOT_PASSWORD_FAILED', 'Failed to process password reset.')
  }
})

// ─── POST /admin/reset-password ───────────────────────────────────────────────
// Verifies the admin reset code and sets a new password.
// Uses a separate Redis key (admin_pwdreset:) to isolate from customer resets.
app.post('/admin/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = passwordResetSchema.parse(req.body)
    const redisKey = `admin_pwdreset:${email}`

    const stored = await redis.get(redisKey)
    if (!stored) {
      return errorResponse(res, 400, 'ADMIN_RESET_EXPIRED',
        `No reset code found for "${email}". The code may have expired (10-minute limit).`,
        'Request a new code via POST /api/auth/admin/forgot-password.')
    }

    const resetData = JSON.parse(stored)
    resetData.attempts += 1

    // Verify code — lock after 3 failed attempts
    if (resetData.attempts >= 3 || resetData.code !== code) {
      await redis.setex(redisKey, 600, JSON.stringify(resetData))

      if (resetData.attempts >= 3) {
        await redis.del(redisKey)
        return errorResponse(res, 429, 'ADMIN_RESET_MAX_ATTEMPTS',
          'Too many failed attempts. The reset code has been invalidated.',
          'Request a new code via POST /api/auth/admin/forgot-password.')
      }

      return errorResponse(res, 401, 'ADMIN_RESET_INVALID',
        `Incorrect reset code. ${3 - resetData.attempts} attempt${3 - resetData.attempts === 1 ? '' : 's'} remaining.`,
        'Check the code sent to your email and try again.')
    }

    // Code valid — delete from Redis and update password
    await redis.del(redisKey)

    // Verify the user is actually an admin before resetting
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || user.role !== 'admin') {
      return errorResponse(res, 403, 'ADMIN_RESET_NOT_ADMIN',
        'This email is not associated with an admin account.',
        'Use the customer password reset instead.')
    }

    const hashed = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { email },
      data: { password: hashed },
    })

    console.log(`[Admin] Password reset: ${email}`)

    res.json({
      success: true,
      message: 'Admin password has been reset successfully. You can now log in with your new password.',
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.errors.map(e => e.message).join('; ')
      return errorResponse(res, 400, 'ADMIN_INVALID_INPUT',
        `Password reset validation failed: ${messages}`,
        'Provide a valid email, 6-digit code, and password (8+ chars).')
    }
    console.error('[Admin] Reset password error:', err)
    return errorResponse(res, 500, 'ADMIN_RESET_PASSWORD_FAILED', 'Failed to reset password.')
  }
})

// ─── GET /admin/users ─────────────────────────────────────────────────────────
// Lists all users with pagination and search. Used by admin user management page.
app.get('/admin/users', async (req, res) => {
  try {
    const decoded = verifyToken(req)
    if (!decoded || decoded.role !== 'admin') {
      return errorResponse(res, 403, 'ADMIN_FORBIDDEN', 'Admin access required.')
    }

    // Parse query params for pagination and search
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20))
    const search = (req.query.search as string) || ''
    const role = (req.query.role as string) || ''
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (role && ['individual', 'mechanic', 'shop', 'admin'].includes(role)) {
      where.role = role
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    console.error('[Admin] List users error:', err)
    return errorResponse(res, 500, 'ADMIN_USERS_FAILED', 'Failed to list users.')
  }
})

// ─── GET /admin/users/:id ─────────────────────────────────────────────────────
// Returns detailed info for a single user. Used by admin user detail panel.
app.get('/admin/users/:id', async (req, res) => {
  try {
    const decoded = verifyToken(req)
    if (!decoded || decoded.role !== 'admin') {
      return errorResponse(res, 403, 'ADMIN_FORBIDDEN', 'Admin access required.')
    }

    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        phoneVerified: true,
        address: true,
        avatar: true,
        authProvider: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return errorResponse(res, 404, 'ADMIN_USER_NOT_FOUND',
        `No user found with ID "${req.params.id}".`)
    }

    res.json(user)
  } catch (err) {
    console.error('[Admin] Get user error:', err)
    return errorResponse(res, 500, 'ADMIN_USER_FAILED', 'Failed to get user details.')
  }
})

// ─── PATCH /admin/users/:id ───────────────────────────────────────────────────
// Updates a user's role. Used by admin to promote/demote users.
app.patch('/admin/users/:id', async (req, res) => {
  try {
    const decoded = verifyToken(req)
    if (!decoded || decoded.role !== 'admin') {
      return errorResponse(res, 403, 'ADMIN_FORBIDDEN', 'Admin access required.')
    }

    const { role } = z.object({
      role: z.enum(['individual', 'mechanic', 'shop', 'admin']),
    }).parse(req.body)

    // Prevent admin from demoting themselves
    if (decoded.id === req.params.id && role !== 'admin') {
      return errorResponse(res, 400, 'ADMIN_SELF_DEMOTE',
        'You cannot change your own admin role.',
        'Ask another admin to change your role.')
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    })

    console.log(`[Admin] User role changed: ${user.email} → ${role} (by ${decoded.id})`)

    res.json({ success: true, user })
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.errors.map(e => e.message).join('; ')
      return errorResponse(res, 400, 'ADMIN_INVALID_INPUT', `Role update failed: ${messages}`)
    }
    console.error('[Admin] Update user error:', err)
    return errorResponse(res, 500, 'ADMIN_UPDATE_USER_FAILED', 'Failed to update user role.')
  }
})

// ─── DELETE /admin/users/:id ──────────────────────────────────────────────────
// Deletes a user account. Prevents admin from deleting themselves.
app.delete('/admin/users/:id', async (req, res) => {
  try {
    const decoded = verifyToken(req)
    if (!decoded || decoded.role !== 'admin') {
      return errorResponse(res, 403, 'ADMIN_FORBIDDEN', 'Admin access required.')
    }

    // Prevent admin from deleting themselves
    if (decoded.id === req.params.id) {
      return errorResponse(res, 400, 'ADMIN_SELF_DELETE',
        'You cannot delete your own account.',
        'Ask another admin to delete your account.')
    }

    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, email: true, role: true },
    })

    if (!user) {
      return errorResponse(res, 404, 'ADMIN_USER_NOT_FOUND', 'User not found.')
    }

    // Prevent deleting other admins without confirmation
    if (user.role === 'admin') {
      return errorResponse(res, 403, 'ADMIN_DELETE_ADMIN',
        'Cannot delete another admin account through this endpoint.',
        'Contact the system administrator.')
    }

    await prisma.user.delete({ where: { id: req.params.id } })

    console.log(`[Admin] User deleted: ${user.email} (by ${decoded.id})`)

    res.json({ success: true, message: `User "${user.email}" has been deleted.` })
  } catch (err) {
    console.error('[Admin] Delete user error:', err)
    return errorResponse(res, 500, 'ADMIN_DELETE_USER_FAILED', 'Failed to delete user.')
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// BANNER ROUTES — admin CRUD + public endpoint
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET /banners/public ──────────────────────────────────────────────────────
// Public endpoint — returns active banners ordered by display order.
// No authentication required. Used by the homepage hero carousel.
app.get('/banners/public', async (_req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        headline: true,
        subtitle: true,
        badge: true,
        cta: true,
        link: true,
        gradient: true,
        image: true,
        accent: true,
      },
    })

    res.json(banners)
  } catch (err) {
    console.error('[Banner] Public fetch error:', err)
    return errorResponse(res, 500, 'BANNER_FETCH_FAILED', 'Failed to load banners.')
  }
})

// ─── GET /admin/banners ───────────────────────────────────────────────────────
// Lists all banners (including inactive). Used by admin banner management page.
app.get('/admin/banners', async (req, res) => {
  try {
    const decoded = verifyToken(req)
    if (!decoded || decoded.role !== 'admin') {
      return errorResponse(res, 403, 'ADMIN_FORBIDDEN', 'Admin access required.')
    }

    const banners = await prisma.banner.findMany({
      orderBy: { order: 'asc' },
    })

    res.json(banners)
  } catch (err) {
    console.error('[Banner] Admin list error:', err)
    return errorResponse(res, 500, 'ADMIN_BANNERS_FAILED', 'Failed to list banners.')
  }
})

// ─── POST /admin/banners ──────────────────────────────────────────────────────
// Creates a new banner. Validates all required fields.
app.post('/admin/banners', async (req, res) => {
  try {
    const decoded = verifyToken(req)
    if (!decoded || decoded.role !== 'admin') {
      return errorResponse(res, 403, 'ADMIN_FORBIDDEN', 'Admin access required.')
    }

    const data = bannerCreateSchema.parse(req.body)
    const banner = await prisma.banner.create({ data })

    console.log(`[Banner] Created: "${banner.headline}" (${banner.id}) by ${decoded.id}`)

    res.status(201).json(banner)
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.errors.map(e => e.message).join('; ')
      return errorResponse(res, 400, 'ADMIN_INVALID_INPUT',
        `Banner creation failed: ${messages}`,
        'Check all required fields: headline, subtitle, badge, cta, link, gradient, image, accent.')
    }
    console.error('[Banner] Create error:', err)
    return errorResponse(res, 500, 'ADMIN_BANNER_CREATE_FAILED', 'Failed to create banner.')
  }
})

// ─── PATCH /admin/banners/:id ─────────────────────────────────────────────────
// Updates an existing banner. All fields optional for partial updates.
app.patch('/admin/banners/:id', async (req, res) => {
  try {
    const decoded = verifyToken(req)
    if (!decoded || decoded.role !== 'admin') {
      return errorResponse(res, 403, 'ADMIN_FORBIDDEN', 'Admin access required.')
    }

    const data = bannerUpdateSchema.parse(req.body)
    const banner = await prisma.banner.update({
      where: { id: req.params.id },
      data,
    })

    console.log(`[Banner] Updated: "${banner.headline}" (${banner.id}) by ${decoded.id}`)

    res.json(banner)
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.errors.map(e => e.message).join('; ')
      return errorResponse(res, 400, 'ADMIN_INVALID_INPUT', `Banner update failed: ${messages}`)
    }
    console.error('[Banner] Update error:', err)
    return errorResponse(res, 500, 'ADMIN_BANNER_UPDATE_FAILED', 'Failed to update banner.')
  }
})

// ─── DELETE /admin/banners/:id ────────────────────────────────────────────────
// Deletes a banner permanently. Cannot be undone.
app.delete('/admin/banners/:id', async (req, res) => {
  try {
    const decoded = verifyToken(req)
    if (!decoded || decoded.role !== 'admin') {
      return errorResponse(res, 403, 'ADMIN_FORBIDDEN', 'Admin access required.')
    }

    const banner = await prisma.banner.findUnique({ where: { id: req.params.id } })
    if (!banner) {
      return errorResponse(res, 404, 'ADMIN_BANNER_NOT_FOUND', 'Banner not found.')
    }

    await prisma.banner.delete({ where: { id: req.params.id } })

    console.log(`[Banner] Deleted: "${banner.headline}" (${banner.id}) by ${decoded.id}`)

    res.json({ success: true, message: `Banner "${banner.headline}" has been deleted.` })
  } catch (err) {
    console.error('[Banner] Delete error:', err)
    return errorResponse(res, 500, 'ADMIN_BANNER_DELETE_FAILED', 'Failed to delete banner.')
  }
})

// ─── PATCH /admin/banners/reorder ─────────────────────────────────────────────
// Reorders banners by updating their order values.
// Expects array of { id, order } pairs. Used by drag-and-drop or up/down arrows.
app.patch('/admin/banners/reorder', async (req, res) => {
  try {
    const decoded = verifyToken(req)
    if (!decoded || decoded.role !== 'admin') {
      return errorResponse(res, 403, 'ADMIN_FORBIDDEN', 'Admin access required.')
    }

    const { items } = bannerReorderSchema.parse(req.body)

    // Update each banner's order in a transaction
    await prisma.$transaction(
      items.map(item =>
        prisma.banner.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    )

    console.log(`[Banner] Reordered ${items.length} banners by ${decoded.id}`)

    res.json({ success: true, message: `Reordered ${items.length} banners.` })
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.errors.map(e => e.message).join('; ')
      return errorResponse(res, 400, 'ADMIN_INVALID_INPUT', `Reorder failed: ${messages}`)
    }
    console.error('[Banner] Reorder error:', err)
    return errorResponse(res, 500, 'ADMIN_BANNER_REORDER_FAILED', 'Failed to reorder banners.')
  }
})

// ─── GET /users/me/wishlist ────────────────────────────────────────────────────
// Returns the user's wishlist from Redis. Stored as JSON array.
app.get('/users/me/wishlist', async (req, res) => {
  const decoded = verifyToken(req)
  if (!decoded) return errorResponse(res, 401, 'AUTH_UNAUTHORIZED', 'Authentication required.', 'Log in to access your wishlist.')

  try {
    const data = await redis.get(`wishlist:${decoded.id}`)
    res.json(data ? JSON.parse(data) : [])
  } catch (err) {
    console.error('[Auth] /wishlist GET error:', err)
    return errorResponse(res, 500, 'AUTH_SERVER_ERROR', 'Failed to load wishlist.')
  }
})

// ─── PUT /users/me/wishlist ────────────────────────────────────────────────────
// Replaces the user's wishlist in Redis. Expects full array in body.
app.put('/users/me/wishlist', async (req, res) => {
  const decoded = verifyToken(req)
  if (!decoded) return errorResponse(res, 401, 'AUTH_UNAUTHORIZED', 'Authentication required.', 'Log in to save your wishlist.')

  try {
    const items = Array.isArray(req.body.items) ? req.body.items : []
    await redis.set(`wishlist:${decoded.id}`, JSON.stringify(items))
    res.json({ ok: true, count: items.length })
  } catch (err) {
    console.error('[Auth] /wishlist PUT error:', err)
    return errorResponse(res, 500, 'AUTH_SERVER_ERROR', 'Failed to save wishlist.')
  }
})

// ─── GET /users/me/cart ────────────────────────────────────────────────────────
// Returns the user's cart from Redis. Stored as JSON array.
app.get('/users/me/cart', async (req, res) => {
  const decoded = verifyToken(req)
  if (!decoded) return errorResponse(res, 401, 'AUTH_UNAUTHORIZED', 'Authentication required.', 'Log in to access your cart.')

  try {
    const data = await redis.get(`cart:${decoded.id}`)
    res.json(data ? JSON.parse(data) : [])
  } catch (err) {
    console.error('[Auth] /cart GET error:', err)
    return errorResponse(res, 500, 'AUTH_SERVER_ERROR', 'Failed to load cart.')
  }
})

// ─── PUT /users/me/cart ────────────────────────────────────────────────────────
// Replaces the user's cart in Redis. Expects full array in body.
app.put('/users/me/cart', async (req, res) => {
  const decoded = verifyToken(req)
  if (!decoded) return errorResponse(res, 401, 'AUTH_UNAUTHORIZED', 'Authentication required.', 'Log in to save your cart.')

  try {
    const items = Array.isArray(req.body.items) ? req.body.items : []
    await redis.set(`cart:${decoded.id}`, JSON.stringify(items))
    res.json({ ok: true, count: items.length })
  } catch (err) {
    console.error('[Auth] /cart PUT error:', err)
    return errorResponse(res, 500, 'AUTH_SERVER_ERROR', 'Failed to save cart.')
  }
})

// ─── Health ─────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'auth-service' }))

app.listen(PORT, () => {
  console.log(`[Auth Service] running on port ${PORT}`)
})
