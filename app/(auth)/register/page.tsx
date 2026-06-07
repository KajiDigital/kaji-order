export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getPlatformSettings } from '@/app/lib/platform'
import { RequestRegisterForm } from '@/app/components/auth/RequestRegisterForm'
import { SelfServeRegisterForm } from '@/app/components/auth/SelfServeRegisterForm'

export default async function RegisterPage() {
  const settings = await getPlatformSettings()
  const selfServe = settings.registration_mode === 'self_serve'

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-1">
          {selfServe ? 'Register your restaurant' : 'Request access'}
        </h1>
        <p className="text-slate-400 text-sm mb-6">
          {selfServe
            ? 'Create your account and start taking orders'
            : 'Tell us about your restaurant and we&apos;ll get you set up'}
        </p>

        {selfServe ? <SelfServeRegisterForm /> : <RequestRegisterForm />}

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="text-violet-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
