import type { ReactNode } from 'react'

type AuthTheme = 'restaurant' | 'admin'

type AuthShellProps = {
  theme: AuthTheme
  children: ReactNode
  maxWidth?: 'md' | 'lg'
}

const maxWidthClass = {
  md: 'max-w-md',
  lg: 'max-w-lg',
}

export function AuthShell({ theme, children, maxWidth = 'md' }: AuthShellProps) {
  return (
    <div
      data-auth-theme={theme}
      className={`auth-shell flex items-center justify-center p-4 ${theme === 'admin' ? 'auth-shell--admin' : ''}`}
    >
      <div className={`w-full ${maxWidthClass[maxWidth]}`}>{children}</div>
    </div>
  )
}
