type Props = {
  canMoveUp: boolean
  canMoveDown: boolean
  onMoveUp: () => void
  onMoveDown: () => void
}

export function CategoryOrderButtons({ canMoveUp, canMoveDown, onMoveUp, onMoveDown }: Props) {
  return (
    <div className="menu-builder-category-order">
      <button
        type="button"
        className="menu-builder-category-order-btn"
        disabled={!canMoveUp}
        onClick={onMoveUp}
        aria-label="Move category up"
        title="Move up"
      >
        ↑
      </button>
      <button
        type="button"
        className="menu-builder-category-order-btn"
        disabled={!canMoveDown}
        onClick={onMoveDown}
        aria-label="Move category down"
        title="Move down"
      >
        ↓
      </button>
    </div>
  )
}
