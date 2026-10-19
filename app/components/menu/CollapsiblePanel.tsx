'use client'

import type { ReactNode } from 'react'

type Props = {
  title: string
  expanded: boolean
  onToggle: () => void
  headerAction?: ReactNode
  children: ReactNode
  className?: string
}

export function CollapsiblePanel({
  title,
  expanded,
  onToggle,
  headerAction,
  children,
  className = '',
}: Props) {
  return (
    <div className={className}>
      <div className="flex items-center gap-1 mb-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-1.5 flex-1 text-left group"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="shrink-0 transition-transform"
            style={{
              color: 'var(--mb-muted)',
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: 'var(--mb-muted)' }}
          >
            {title}
          </span>
        </button>
        {headerAction}
      </div>
      {expanded && children}
    </div>
  )
}
