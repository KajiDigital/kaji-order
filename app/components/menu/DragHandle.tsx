type Props = {
  className?: string
  draggable?: boolean
  onDragStart?: (e: React.DragEvent) => void
  onClick?: (e: React.MouseEvent) => void
  label?: string
}

export function DragHandle({
  className = '',
  draggable,
  onDragStart,
  onClick,
  label = 'Drag to reorder',
}: Props) {
  return (
    <span
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
      className={`menu-builder-drag-handle shrink-0 ${className}`.trim()}
      title={label}
      aria-label={label}
    >
      ⠿
    </span>
  )
}
