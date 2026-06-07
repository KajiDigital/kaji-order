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

  console.log('Seeded admin user: admin@kajipos.co.uk')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
