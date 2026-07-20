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

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['mechanic', 'individual', 'shop']).default('individual'),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

app.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body)
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) return res.status(409).json({ error: 'Email already registered' })

    const hashed = await bcrypt.hash(data.password, 12)
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, password: hashed, role: data.role },
    })

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors })
    res.status(500).json({ error: 'Registration failed' })
  }
})

app.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { email: data.email } })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(data.password, user.password)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors })
    res.status(500).json({ error: 'Login failed' })
  }
})

app.get('/me', async (req, res) => {
  try {
    const header = req.headers.authorization
    if (!header) return res.status(401).json({ error: 'No token' })
    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string }
    const user = await prisma.user.findUnique({ where: { id: decoded.id }, select: { id: true, name: true, email: true, role: true } })
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
})

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'auth-service' }))

app.listen(PORT, () => {
  console.log(`[Auth Service] running on port ${PORT}`)
})
