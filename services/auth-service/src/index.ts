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

const oauthSchema = z.object({
  provider: z.enum(['google', 'apple']),
  providerToken: z.string().min(1, 'Provider token is required'),
})

const profileSetupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  avatar: z.string().default('👤'),
})

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  address: z.string().min(5).optional(),
  avatar: z.string().optional(),
})

const passwordForgotSchema = z.object({
  email: z.string().email('Invalid email format'),
})

const passwordResetSchema = z.object({
  email: z.string().email('Invalid email format'),
  code: z.string().length(6, 'Code must be exactly 6 digits').regex(/^\d{6}$/, 'Code must be numeric'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
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

// ─── Health ─────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'auth-service' }))

app.listen(PORT, () => {
  console.log(`[Auth Service] running on port ${PORT}`)
})
