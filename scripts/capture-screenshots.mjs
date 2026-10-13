#!/usr/bin/env node
/**
 * capture-screenshots.mjs — Capture README screenshots of the deployed AutoMart site.
 *
 * Captures the key pages as crisp PNGs (1440x900 @2x) into docs/screenshots/:
 *   01-home, 02-search, 03-product, 04-cart, 05-checkout,
 *   06-orders, 07-admin-dashboard, 08-chat-assistant
 *
 * It registers two THROWAWAY accounts on the live site (customer + admin) to
 * access protected pages, seeds a cart + two orders with realistic statuses,
 * and deletes both accounts at the end.
 *
 * Usage:
 *   node scripts/capture-screenshots.mjs
 *
 * Env overrides:
 *   BASE_URL  (default https://auto-mart-web.vercel.app)
 *   API_URL   (default https://automart-backend-f1ic.onrender.com)
 */
import { mkdir, stat, rm } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const BASE = process.env.BASE_URL || 'http://localhost:3080'
const API = process.env.API_URL || 'http://localhost:3000'
const OUT = new URL('../docs/screenshots/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

// Seeded demo accounts (from services/auth-service/prisma/seed.js)
const CUSTOMER = { email: 'priya@example.com', password: 'Password123!' }
const ADMIN = { email: 'admin@automart.com', password: 'AutoMart@2026!' }

const log = (...a) => console.log('▸', ...a)

/* ─── API helpers ─────────────────────────────────────────────────────────── */

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, ok: res.ok, data }
}

/** Poll the backend /health until 200 (Render free tier cold-starts ~40s). */
async function warmBackend() {
  log(`Warming backend ${API} (cold start can take ~40s)…`)
  const deadline = Date.now() + 240_000
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${API}/health`, { signal: AbortSignal.timeout(10_000) })
      if (res.ok) return log('Backend is warm.')
    } catch { /* not up yet */ }
    await new Promise(r => setTimeout(r, 5_000))
  }
  throw new Error('Backend did not become healthy in 4 minutes.')
}

/* ─── Screenshot helpers ──────────────────────────────────────────────────── */

async function shot(page, name) {
  // Let fonts + entry animations settle so text is crisp and nothing is mid-fade
  await page.evaluate(() => document.fonts.ready).catch(() => {})
  await page.waitForTimeout(800)
  const path = `${OUT}${name}.jpg`
  // JPEG keeps photographic product shots small enough for fast GitHub README loading
  await page.screenshot({ path, type: 'jpeg', quality: 85 })
  const { size } = await stat(path)
  log(`📸 ${name}.jpg  (${(size / 1024).toFixed(0)} KB)`)
}

/** Navigate and wait for the page to calm down (network + a short settle delay). */
async function visit(page, url, settleMs = 3500) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {})
  await page.waitForTimeout(settleMs)
}

/* ─── Main ────────────────────────────────────────────────────────────────── */

async function main() {
  await mkdir(OUT, { recursive: true })
  await warmBackend()

  // 1️⃣  Log in as the seeded customer + admin (already in the local DB — no registration)
  log('Logging in seeded accounts…')
  const custLogin = await api('/api/auth/login', { method: 'POST', body: CUSTOMER })
  const customerToken = custLogin.data.token
  if (!customerToken) throw new Error(`Customer login failed: ${JSON.stringify(custLogin.data)}`)

  const adminLogin = await api('/api/auth/admin/login', { method: 'POST', body: ADMIN })
  if (!adminLogin.ok) throw new Error(`Admin login failed: ${JSON.stringify(adminLogin.data)}`)
  const adminToken = adminLogin.data.token
  const adminUser = adminLogin.data.user
  log(`Customer: ${CUSTOMER.email}  |  Admin: ${ADMIN.email}`)

  // 2️⃣  Fetch real products to build a realistic cart / orders / product page
  const products = (await api('/api/products')).data
  if (!Array.isArray(products) || products.length === 0) throw new Error('No products returned from API.')
  const priced = products.filter(p => Number(p.price) > 0)
  const pick = n => priced[n % priced.length]
  log(`Fetched ${products.length} products.`)

  const cartItems = [pick(0), pick(1), pick(3)].map(p => ({
    id: p.id, name: p.name, price: Number(p.price), qty: 1, imageUrl: p.imageUrl,
  }))

  // 3️⃣  Seed two orders with different statuses so the orders page looks alive
  //     (statuses walk the order-service state machine: pending→confirmed→picked→shipped)
  log('Seeding demo orders…')
  const mkOrder = async (items, address) => {
    const total = items.reduce((s, i) => s + i.price * i.qty, 0)
    const r = await api('/api/orders', {
      method: 'POST', token: customerToken,
      body: { items, address, phone: '+919876543210', total },
    })
    return r.ok ? r.data.id : null
  }
  const setStatus = (id, status) => api(`/api/orders/${id}/status`, { method: 'PATCH', token: adminToken, body: { status } })

  const order1 = await mkOrder([cartItems[0], cartItems[1]], '221B MG Road, Indiranagar, Bengaluru 560038')
  if (order1) { await setStatus(order1, 'confirmed'); await setStatus(order1, 'picked'); await setStatus(order1, 'shipped') }
  const order2 = await mkOrder([cartItems[2]], '14th Cross, Jayanagar, Bengaluru 560041')
  if (order2) await setStatus(order2, 'confirmed')
  log(`Orders: ${order1 ? 'shipped' : 'failed'} + ${order2 ? 'confirmed' : 'failed'}`)

  // 4️⃣  Browser — desktop 1440x900 @2x for crisp README images
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()

  // Warm the frontend once (and set origin for localStorage writes)
  await visit(page, BASE, 2000)

  // Store the customer JWT the same way the app does after login
  await page.evaluate(t => localStorage.setItem('token', t), customerToken)

  // ── 01 Home ──
  log('Capturing home…')
  await visit(page, `${BASE}/`, 4500)
  await shot(page, '01-home')

  // ── 02 Search ──
  log('Capturing search…')
  await visit(page, `${BASE}/search?q=brake`, 5000)
  await shot(page, '02-search')

  // ── 03 Product detail ──
  const product = cartItems[0]
  log(`Capturing product detail (${product.name})…`)
  await visit(page, `${BASE}/products/${product.id}`, 4000)
  await shot(page, '03-product')

  // ── 04 Cart (seed localStorage exactly like the app writes it) ──
  log('Capturing cart…')
  await page.evaluate(c => localStorage.setItem('cart', c), JSON.stringify(cartItems))
  await visit(page, `${BASE}/cart`, 3500)
  await shot(page, '04-cart')

  // ── 05 Checkout (fill the delivery form, do NOT submit) ──
  log('Capturing checkout…')
  await visit(page, `${BASE}/checkout`, 3500)
  await page.fill('textarea[placeholder="Street, building, landmark"]', '221B MG Road, Indiranagar, near Purple Line metro gate').catch(() => {})
  await page.fill('input[placeholder="+1 234 567 890"]', '+91 98765 43210').catch(() => {})
  await page.waitForTimeout(600)
  await shot(page, '05-checkout')

  // ── 06 Orders ──
  log('Capturing orders…')
  await visit(page, `${BASE}/orders`, 4500)
  await shot(page, '06-orders')

  // ── 08 Chat assistant (before logging out of the customer session) ──
  log('Capturing TORQ assistant (waiting for streamed reply + product rail)…')
  await visit(page, `${BASE}/`, 3500)
  await page.click('button[aria-label="Open TORQ assistant"]').catch(() => {})
  await page.waitForTimeout(1200)
  await page.fill('textarea[placeholder="Ask TORQ…"]', 'brake pads').catch(() => {})
  await page.keyboard.press('Enter').catch(() => {})
  // Template-mode replies are fast; allow up to 40s in case the backend was cold
  await page.waitForSelector('img[alt]', { timeout: 40_000 }).catch(() => {})
  await page.waitForTimeout(2500)
  await shot(page, '08-chat-assistant')

  // ── 07 Admin dashboard (separate context with the admin JWT) ──
  log('Capturing admin dashboard…')
  const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
  const adminPage = await adminCtx.newPage()
  await visit(adminPage, BASE, 1500)
  await adminPage.evaluate(([t, u]) => {
    localStorage.setItem('admin_token', t)
    localStorage.setItem('admin_user', JSON.stringify(u))
  }, [adminToken, adminUser])
  await visit(adminPage, `${BASE}/admin`, 5000)
  await shot(adminPage, '07-admin-dashboard')

  await browser.close()

  console.log('\n✅ Done — 8 screenshots in docs/screenshots/')
}

main().catch(err => { console.error('\n❌ Capture failed:', err.message); process.exit(1) })
