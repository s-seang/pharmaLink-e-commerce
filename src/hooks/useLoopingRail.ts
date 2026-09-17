import { useEffect, type RefObject } from 'react'

/**
 * Advances a horizontal rail on its own, and wraps back to the start when it
 * reaches the end.
 *
 * Pauses while a pointer is over it, so it never slides out from under someone
 * reading or mid-swipe, and stays still entirely for anyone who has asked for
 * reduced motion.
 */
export function useLoopingRail(rail: RefObject<HTMLElement | null>, everyMs = 4000): void {
  useEffect(() => {
    const element = rail.current
    if (!element) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let held = false
    const hold = () => {
      held = true
    }
    const release = () => {
      held = false
    }

    element.addEventListener('pointerenter', hold)
    element.addEventListener('pointerleave', release)
    element.addEventListener('pointerdown', hold)
    element.addEventListener('pointerup', release)
    element.addEventListener('pointercancel', release)

    const tick = window.setInterval(() => {
      if (held) return

      const furthest = element.scrollWidth - element.clientWidth
      if (furthest <= 0) return

      // One item on, or back to the beginning once the end is in view.
      const step = (element.firstElementChild as HTMLElement | null)?.offsetWidth ?? element.clientWidth
      const next = element.scrollLeft + step + 12
      element.scrollTo({ left: next >= furthest - 4 ? 0 : next, behavior: 'smooth' })
    }, everyMs)

    return () => {
      window.clearInterval(tick)
      element.removeEventListener('pointerenter', hold)
      element.removeEventListener('pointerleave', release)
      element.removeEventListener('pointerdown', hold)
      element.removeEventListener('pointerup', release)
      element.removeEventListener('pointercancel', release)
    }
  }, [rail, everyMs])
}
