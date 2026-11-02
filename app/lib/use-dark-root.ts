'use client'

import { useEffect } from 'react'

/** Paint html/body dark so Android Chromium cannot show the global white canvas behind shells. */
export function useDarkRoot() {
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('app-dark')
    return () => {
      root.classList.remove('app-dark')
    }
  }, [])
}
