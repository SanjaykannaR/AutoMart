const { PrismaClient } = require('../src/generated/auth')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding auth database...')

  const password = await bcrypt.hash('Password123!', 12)

  const users = [
    { name: 'Admin User', email: 'admin@automart.com', password, role: 'shop' },
    { name: 'Raj Kumar', email: 'raj@mechanic.com', password, role: 'mechanic' },
    { name: 'Priya Sharma', email: 'priya@example.com', password, role: 'individual' },
    { name: 'AutoZone Parts', email: 'autozone@shop.com', password, role: 'shop' },
  ]

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    })
    console.log(`  Created user: ${user.name} (${user.role})`)
  }

  console.log('Auth seed complete.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
