'use client'

import { useCallback, useMemo, useState } from 'react'

export function useDisplayedSelection(displayedIds: string[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const allDisplayedSelected =
    displayedIds.length > 0 && displayedIds.every((id) => selectedSet.has(id))
  const someDisplayedSelected = displayedIds.some((id) => selectedSet.has(id))

  const toggle = useCallback((id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    )
  }, [])

  const toggleDisplayed = useCallback(() => {
    const visible = new Set(displayedIds)
    if (displayedIds.length > 0 && displayedIds.every((id) => selectedSet.has(id))) {
      setSelectedIds((current) => current.filter((id) => !visible.has(id)))
      return
    }
    setSelectedIds((current) => Array.from(new Set([...current, ...displayedIds])))
  }, [displayedIds, selectedSet])

  const retainVisible = useCallback((ids: string[]) => {
    const visible = new Set(ids)
    setSelectedIds((current) => current.filter((id) => visible.has(id)))
  }, [])

  const clear = useCallback(() => setSelectedIds([]), [])

  return {
    selectedIds,
    selectedSet,
    allDisplayedSelected,
    someDisplayedSelected,
    toggle,
    toggleDisplayed,
    retainVisible,
    clear,
  }
}
