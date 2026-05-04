'use client'

import { useEffect } from 'react'

/**
 * Client component that hides the desktop rail column.
 * Mounts → finds closest .desktop-shell, swaps with-rail → no-rail.
 * Unmounts → restores with-rail.
 */
export default function HideRail() {
  useEffect(() => {
    const shell = document.querySelector('.desktop-shell')
    if (!shell) return

    const hadRail = shell.classList.contains('with-rail')
    if (hadRail) {
      shell.classList.remove('with-rail')
      shell.classList.add('no-rail')
    }

    return () => {
      if (hadRail) {
        shell.classList.remove('no-rail')
        shell.classList.add('with-rail')
      }
    }
  }, [])

  return null
}
