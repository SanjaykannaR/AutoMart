const { PrismaClient } = require('../src/generated/auth')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding auth database...')

  const adminPassword = await bcrypt.hash('Admin@12345', 12)
  const defaultPassword = await bcrypt.hash('Password123!', 12)

  const users = [
    { name: 'Admin User', email: 'admin@automart.com', password: adminPassword, role: 'admin' },
    { name: 'Raj Kumar', email: 'raj@mechanic.com', password: defaultPassword, role: 'mechanic' },
    { name: 'Priya Sharma', email: 'priya@example.com', password: defaultPassword, role: 'individual' },
    { name: 'AutoZone Parts', email: 'autozone@shop.com', password: defaultPassword, role: 'shop' },
  ]

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { password: user.password, role: user.role },
      create: user,
    })
    console.log(`  Created user: ${user.name} (${user.role})`)
  }

  console.log('Auth seed complete.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
