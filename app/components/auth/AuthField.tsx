import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react'

type AuthFieldProps = {
  label: string
  hint?: string
} & (
  | ({ as?: 'input' } & InputHTMLAttributes<HTMLInputElement>)
  | ({ as: 'select' } & SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode })
  | ({ as: 'textarea' } & TextareaHTMLAttributes<HTMLTextAreaElement>)
)

export function AuthField(props: AuthFieldProps) {
  const { label, hint, as = 'input', ...rest } = props

  return (
    <div>
      <label className="auth-label">{label}</label>
      {as === 'select' ? (
        <select className="auth-input" {...(rest as SelectHTMLAttributes<HTMLSelectElement>)}>
          {(props as { children: React.ReactNode }).children}
        </select>
      ) : as === 'textarea' ? (
        <textarea className="auth-input resize-y min-h-[100px]" {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)} />
      ) : (
        <input className="auth-input" {...(rest as InputHTMLAttributes<HTMLInputElement>)} />
      )}
      {hint && (
        <p className="mt-1 text-xs" style={{ color: 'var(--auth-text-hint)' }}>
          {hint}
        </p>
      )}
    </div>
  )
}
