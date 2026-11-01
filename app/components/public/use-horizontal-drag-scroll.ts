'use client'

import { useRef } from 'react'

export function useHorizontalDragScroll() {
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef({
    pointerId: -1,
    startX: 0,
    startScroll: 0,
    moved: false,
  })

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'touch' || e.button !== 0) return
    const el = ref.current
    if (!el) return
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: false,
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current
    const state = drag.current
    if (!el || state.pointerId !== e.pointerId) return
    const dx = e.clientX - state.startX
    if (!state.moved) {
      if (Math.abs(dx) < 5) return
      state.moved = true
      try {
        el.setPointerCapture(e.pointerId)
      } catch {
        // Pointer capture is unavailable for this event. Scrolling still follows the pointer.
      }
      el.classList.add('cursor-grabbing')
    }
    el.scrollLeft = state.startScroll - dx
  }

  function finish(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current
    const state = drag.current
    if (state.pointerId !== e.pointerId) return
    state.pointerId = -1
    el?.classList.remove('cursor-grabbing')
    if (el?.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
  }

  function onClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    if (!drag.current.moved) return
    e.preventDefault()
    e.stopPropagation()
    drag.current.moved = false
  }

  return {
    ref,
    onPointerDown,
    onPointerMove,
    onPointerUp: finish,
    onPointerCancel: finish,
    onClickCapture,
  }
}
