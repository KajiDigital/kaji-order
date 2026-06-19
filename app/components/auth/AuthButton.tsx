import type { ButtonHTMLAttributes } from 'react'

type AuthButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary'
  fullWidth?: boolean
}

export function AuthButton({
  variant = 'primary',
  fullWidth = true,
  className = '',
  type = 'button',
  children,
  ...rest
}: AuthButtonProps) {
  const baseClass = variant === 'primary' ? 'auth-btn-primary' : 'auth-btn-secondary'
  const widthClass = fullWidth ? 'w-full' : ''

  return (
    <button type={type} className={`${baseClass} ${widthClass} ${className}`.trim()} {...rest}>
      {children}
    </button>
  )
}
