export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getPlatformSettings } from '@/app/lib/platform'
import { RequestRegisterForm } from '@/app/components/auth/RequestRegisterForm'
import { SelfServeRegisterForm } from '@/app/components/auth/SelfServeRegisterForm'
import { AuthShell } from '@/app/components/auth/AuthShell'
import { AuthCard } from '@/app/components/auth/AuthCard'
import { AuthFooterLink } from '@/app/components/auth/AuthFooterLink'

export default async function RegisterPage() {
  const settings = await getPlatformSettings()
  const selfServe = settings.registration_mode === 'self_serve'

  return (
    <AuthShell theme="restaurant" maxWidth="lg">
      <AuthCard
        title={selfServe ? 'Register your restaurant' : 'Request access'}
        subtitle={
          selfServe
            ? 'Create your account and start taking orders'
            : "Tell us about your restaurant and we'll get you set up"
        }
      >
        {selfServe ? <SelfServeRegisterForm /> : <RequestRegisterForm />}

        <div className="mt-6">
          <AuthFooterLink>
            Already have an account?{' '}
            <Link href="/login">Sign in</Link>
          </AuthFooterLink>
        </div>
      </AuthCard>
    </AuthShell>
  )
}
