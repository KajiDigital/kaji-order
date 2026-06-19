import Link from 'next/link'
import type { ReactNode } from 'react'

type AuthFooterLinkProps = {
  children: ReactNode
}

export function AuthFooterLink({ children }: AuthFooterLinkProps) {
  return <p className="auth-footer">{children}</p>
}

type AuthCrossLinkProps = {
  prefix: string
  href: string
  linkText: string
}

export function AuthCrossLink({ prefix, href, linkText }: AuthCrossLinkProps) {
  return (
    <AuthFooterLink>
      {prefix}{' '}
      <Link href={href}>{linkText}</Link>
    </AuthFooterLink>
  )
}
