#!/usr/bin/env node
// ================================================================
// AutoMart — Create Demo Orders via API
// Run after seed-users.js and seed.sql: node scripts/seed-orders.js
// ================================================================

const API_URL = process.env.API_URL || 'http://localhost:3000'

// Sample product IDs from the database (will be fetched dynamically)
const sampleOrders = [
  {
    user: { email: 'priya@example.com', password: 'Password123!' },
    items: [
      { name: 'Ceramic Brake Pads (Front)', price: 1499, qty: 1, productId: null },
      { name: 'Brake Fluid DOT 4 (500ml)', price: 449, qty: 2, productId: null },
    ],
    address: '42 MG Road, Koramangala, Bangalore 560034',
    phone: '9876543210',
    note: 'Please deliver before 5 PM',
    status: 'delivered',
  },
  {
    user: { email: 'rajesh@mechanic.com', password: 'Password123!' },
    items: [
      { name: 'Oil Filter (Spin-On)', price: 349, qty: 5, productId: null },
      { name: 'Spark Plug Set (Iridium) — Pack of 4', price: 1899, qty: 2, productId: null },
      { name: 'Air Filter (Panel)', price: 1299, qty: 3, productId: null },
    ],
    address: '15 Anna Salai, T Nagar, Chennai 600017',
    phone: '9845012345',
    note: 'Bulk order for workshop',
    status: 'shipped',
  },
  {
    user: { email: 'priya@example.com', password: 'Password123!' },
    items: [
      { name: 'LED Headlight Bulb H4', price: 1499, qty: 2, productId: null },
      { name: 'LED Fog Light Pair', price: 1499, qty: 1, productId: null },
    ],
    address: '8 Nehru Park, Vasant Kunj, New Delhi 110070',
    phone: '9911223344',
    note: null,
    status: 'pending',
  },
  {
    user: { email: 'autozone@shop.com', password: 'Password123!' },
    items: [
      { name: 'Car Battery 12V 60Ah', price: 5999, qty: 2, productId: null },
      { name: 'Starter Motor', price: 4999, qty: 1, productId: null },
    ],
    address: '203 Industrial Area Phase 2, Pune 411018',
    phone: '9765432109',
    note: 'Shop inventory restocking',
    status: 'confirmed',
  },
  {
    user: { email: 'rajesh@mechanic.com', password: 'Password123!' },
    items: [
      { name: 'Front Shock Absorber', price: 2999, qty: 2, productId: null },
      { name: 'Lower Ball Joint', price: 1199, qty: 4, productId: null },
    ],
    address: '7 GT Road, Howrah, West Bengal 711101',
    phone: '9834567890',
    note: 'Customer car — Maruti Swift 2019',
    status: 'pending',
  },
]

async function login(email, password) {
  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      console.log(`  ❌ Login failed for ${email}: ${data.message}`)
      return null
    }
    return data.token
  } catch (err) {
    console.log(`  ❌ Login error for ${email}: ${err.message}`)
    return null
  }
}

async function getProducts(token) {
  try {
    const res = await fetch(`${API_URL}/api/products`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    return data.products || data || []
  } catch (err) {
    console.log(`  ❌ Failed to fetch products: ${err.message}`)
    return []
  }
}

async function createOrder(token, order) {
  try {
    // Resolve product IDs from names
    const items = order.items.map(item => ({
      id: item.productId || item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: item.name,
      price: item.price,
      qty: item.qty,
    }))

    const total = items.reduce((sum, item) => sum + item.price * item.qty, 0)

    const res = await fetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        items,
        total,
        address: order.address,
        phone: order.phone,
        note: order.note,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      console.log(`  ❌ Order failed: ${data.message}`)
      return null
    }

    // Update status if not pending
    if (order.status !== 'pending' && data.id) {
      await fetch(`${API_URL}/api/orders/${data.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: order.status }),
      })
    }

    return data
  } catch (err) {
    console.log(`  ❌ Order error: ${err.message}`)
    return null
  }
}

async function main() {
  console.log(`\n🛒 Creating demo orders via ${API_URL}\n`)

  // Get a token for fetching products
  const adminToken = await login('admin@automart.com', 'Admin@12345')
  if (!adminToken) {
    console.log('❌ Cannot proceed without admin login')
    return
  }

  // Cache tokens per user
  const tokens = {}

  let created = 0
  for (const order of sampleOrders) {
    // Login as the order's user
    if (!tokens[order.user.email]) {
      tokens[order.user.email] = await login(order.user.email, order.user.password)
    }
    const token = tokens[order.user.email]
    if (!token) continue

    const result = await createOrder(token, order)
    if (result) {
      created++
      const total = order.items.reduce((s, i) => s + i.price * i.qty, 0)
      console.log(`  ✅ Order #${created} — ₹${total.toLocaleString('en-IN')} — ${order.status} — ${order.user.email}`)
    }
  }

  console.log(`\n✅ Created ${created}/${sampleOrders.length} demo orders.\n`)
}

main()
