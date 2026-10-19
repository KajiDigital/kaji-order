'use client'

type Props = {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function MenuBuilderHeaderToggle({ label, checked, onChange, disabled }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`menu-builder-header-toggle ${checked ? 'menu-builder-header-toggle--on' : ''}`}
    >
      <span className="menu-builder-header-toggle__track" aria-hidden>
        <span className="menu-builder-header-toggle__thumb" />
      </span>
      <span className="menu-builder-header-toggle__label">{label}</span>
    </button>
  )
}
