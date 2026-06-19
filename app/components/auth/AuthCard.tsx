import type { ReactNode } from 'react'

type AuthCardProps = {
  title: string
  subtitle?: string
  badge?: string
  icon?: ReactNode
  children: ReactNode
  footer?: ReactNode
}

export function AuthCard({
  title,
  subtitle,
  badge,
  icon,
  children,
  footer,
}: AuthCardProps) {
  return (
    <div className="auth-card p-8">
      {badge && (
        <div className="mb-4">
          <span className="auth-badge">{badge}</span>
        </div>
      )}
      <div className="flex items-start gap-3 mb-6">
        {icon && (
          <div
            className="shrink-0 flex items-center justify-center w-10 h-10 rounded-lg"
            style={{ background: 'var(--auth-badge-bg)', color: 'var(--auth-accent)' }}
          >
            {icon}
          </div>
        )}
        <div>
          <h1 className="auth-heading text-2xl font-semibold leading-tight">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm" style={{ color: 'var(--auth-text-muted)' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {children}
      {footer && <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--auth-border)' }}>{footer}</div>}
    </div>
  )
}
