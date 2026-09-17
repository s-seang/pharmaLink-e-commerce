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

/**
 * The same idea at walking pace: instead of jumping a card at a time, the rail
 * creeps along and slips back to the start when it runs out.
 *
 * Measured in pixels per second, so the speed reads the same whatever the
 * screen. Holds still under a pointer, and for anyone who asked for less motion.
 */
export function useDriftingRail(
  rail: RefObject<HTMLElement | null>,
  pxPerSecond = 22,
  /**
   * True when the caller has rendered its items twice. The rail then wraps at
   * the halfway mark, where the second copy looks exactly like the first, so
   * the loop has no seam — rather than snapping back from the end.
   */
  doubled = false,
): void {
  useEffect(() => {
    const element = rail.current
    if (!element) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let held = false
    let frame = 0
    let last = performance.now()

    const hold = () => {
      held = true
    }
    const release = () => {
      held = false
      last = performance.now()
    }

    element.addEventListener('pointerenter', hold)
    element.addEventListener('pointerleave', release)
    element.addEventListener('pointerdown', hold)
    element.addEventListener('pointerup', release)
    element.addEventListener('pointercancel', release)

    const step = (now: number) => {
      const elapsed = now - last
      last = now

      const wrapAt = doubled ? element.scrollWidth / 2 : element.scrollWidth - element.clientWidth
      if (!held && wrapAt > 0) {
        const next = element.scrollLeft + (pxPerSecond * elapsed) / 1000
        element.scrollLeft = next >= wrapAt ? next - wrapAt : next
      }
      frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(frame)
      element.removeEventListener('pointerenter', hold)
      element.removeEventListener('pointerleave', release)
      element.removeEventListener('pointerdown', hold)
      element.removeEventListener('pointerup', release)
      element.removeEventListener('pointercancel', release)
    }
  }, [rail, pxPerSecond, doubled])
}
