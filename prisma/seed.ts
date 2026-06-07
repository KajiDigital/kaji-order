import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('KajiAdmin2026!', 12)

  await prisma.adminUser.upsert({
    where: { email: 'admin@kajipos.co.uk' },
    update: { password },
    create: {
      email: 'admin@kajipos.co.uk',
      password,
      role: 'SUPER_ADMIN',
    },
  })

  await prisma.platformSettings.upsert({
    where: { id: 'platform' },
    create: {
      id: 'platform',
      registration_mode: 'request',
      show_commission: false,
    },
    update: {},
  })

  console.log('Seeded admin user: admin@kajipos.co.uk')
  console.log('Seeded platform settings: registration_mode=request')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
