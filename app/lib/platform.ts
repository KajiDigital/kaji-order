import prisma from './prisma'

const DEFAULT_SETTINGS = {
  id: 'platform',
  registration_mode: 'request',
  show_commission: false,
} as const

export type PlatformSettings = {
  id: string
  registration_mode: string
  show_commission: boolean
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const settings = await prisma.platformSettings.findUnique({
    where: { id: 'platform' },
  })

  if (settings) {
    return settings
  }

  return prisma.platformSettings.create({
    data: DEFAULT_SETTINGS,
  })
}

export async function isSelfServeRegistration(): Promise<boolean> {
  const settings = await getPlatformSettings()
  return settings.registration_mode === 'self_serve'
}
