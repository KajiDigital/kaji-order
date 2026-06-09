import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { getBuiltinDefaultTemplates } from './email-template-defaults'

const prisma = new PrismaClient()

async function seedEmailTemplates() {
  const defaults = getBuiltinDefaultTemplates()

  for (const template of defaults) {
    const existing = await prisma.emailTemplate.findFirst({
      where: { restaurant_id: null, template_type: template.template_type },
    })

    if (existing) {
      await prisma.emailTemplate.update({
        where: { id: existing.id },
        data: {
          subject: template.subject,
          html_body: template.html_body,
          is_active: true,
        },
      })
    } else {
      await prisma.emailTemplate.create({
        data: {
          restaurant_id: null,
          template_type: template.template_type,
          subject: template.subject,
          html_body: template.html_body,
          is_active: true,
        },
      })
    }
  }
}

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

  await seedEmailTemplates()

  console.log('Seeded admin user: admin@kajipos.co.uk')
  console.log('Seeded platform settings: registration_mode=request')
  console.log('Seeded global email templates')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
