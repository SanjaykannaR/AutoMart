#!/usr/bin/env node
// ================================================================
// AutoMart — Create Demo Users via API
// Run after Docker containers are up: node scripts/seed-users.js
// ================================================================

const API_URL = process.env.API_URL || 'http://localhost:3000'

const users = [
  // Admin — already exists from E2E tests, skip if 409
  { name: 'Admin User', email: 'admin@automart.com', password: 'Admin@12345', role: 'admin' },

  // Demo mechanic
  { name: 'Rajesh Kumar', email: 'rajesh@mechanic.com', password: 'Password123!', role: 'mechanic' },

  // Demo individual customer
  { name: 'Priya Sharma', email: 'priya@example.com', password: 'Password123!', role: 'individual' },

  // Demo shop owner
  { name: 'AutoZone Parts', email: 'autozone@shop.com', password: 'Password123!', role: 'shop' },
]

async function createUser(user) {
  try {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    })
    const data = await res.json()

    if (res.status === 409) {
      console.log(`  ⏭  ${user.email} — already exists, skipping`)
      return
    }

    if (!res.ok) {
      console.log(`  ❌ ${user.email} — ${data.message || 'unknown error'}`)
      return
    }

    console.log(`  ✅ ${user.email} — role: ${user.role} (id: ${data.user?.id?.slice(0, 8)}...)`)
  } catch (err) {
    console.log(`  ❌ ${user.email} — connection error: ${err.message}`)
  }
}

async function main() {
  console.log(`\n🚀 Creating demo users via ${API_URL}\n`)

  for (const user of users) {
    await createUser(user)
  }

  console.log('\n✅ Demo user seeding complete.\n')
  console.log('Login credentials:')
  console.log('  admin@automart.com / Admin@12345   (admin)')
  console.log('  rajesh@mechanic.com / Password123! (mechanic)')
  console.log('  priya@example.com / Password123!   (individual)')
  console.log('  autozone@shop.com / Password123!   (shop)')
}

main()
