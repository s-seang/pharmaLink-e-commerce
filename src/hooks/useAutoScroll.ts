import { useEffect, type RefObject } from 'react'

/**
 * Continuously scrolls a horizontal rail whose children are rendered twice.
 * When the first copy has fully passed, the offset is rewound by exactly half
 * the scroll width, so the loop is seamless and has no end.
 *
 * Pauses while the pointer is over the rail, while it has keyboard focus, and
 * when the user prefers reduced motion.
 */
export function useAutoScroll(
  ref: RefObject<HTMLElement | null>,
  { speed = 32, enabled = true }: { speed?: number; enabled?: boolean } = {},
) {
  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return

    let paused = false
    let frame = 0
    let last = performance.now()
    let offset = el.scrollLeft

    const step = (now: number) => {
      const delta = Math.min(now - last, 100) / 1000
      last = now

      const half = el.scrollWidth / 2
      if (half > 0) {
        // Re-sync if the user dragged the rail themselves.
        if (Math.abs(el.scrollLeft - offset) > 2) offset = el.scrollLeft
        if (!paused) offset += speed * delta
        if (offset >= half) offset -= half
        el.scrollLeft = offset
      }

      frame = requestAnimationFrame(step)
    }

    const pause = () => {
      paused = true
    }
    const resume = () => {
      paused = false
    }

    el.addEventListener('pointerenter', pause)
    el.addEventListener('pointerleave', resume)
    el.addEventListener('pointerdown', pause)
    el.addEventListener('pointerup', resume)
    el.addEventListener('focusin', pause)
    el.addEventListener('focusout', resume)

    frame = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('pointerenter', pause)
      el.removeEventListener('pointerleave', resume)
      el.removeEventListener('pointerdown', pause)
      el.removeEventListener('pointerup', resume)
      el.removeEventListener('focusin', pause)
      el.removeEventListener('focusout', resume)
    }
  }, [ref, speed, enabled])
}
