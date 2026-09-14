import { useEffect, useRef, useState } from 'react'

/**
 * True while the header's logo row should be visible. It hides after `threshold`
 * pixels of downward movement and returns after the same amount upward, and is
 * always visible within `offset` pixels of the top.
 *
 * The caller must hide the row without changing layout (transform/opacity only).
 * If hiding it resizes anything, the browser's scroll anchoring compensates by
 * moving the scroll position, which fires a scroll event in the opposite
 * direction and drives this hook straight back — an endless show/hide loop.
 */
export function useHideOnScroll({ offset = 80, threshold = 10 } = {}): boolean {
  const [visible, setVisible] = useState(true)
  const visibleRef = useRef(true)
  const lastY = useRef(0)
  const frame = useRef(0)

  useEffect(() => {
    lastY.current = Math.max(window.scrollY, 0)

    const apply = (next: boolean) => {
      if (visibleRef.current === next) return
      visibleRef.current = next
      setVisible(next)
    }

    const measure = () => {
      frame.current = 0
      const y = Math.max(window.scrollY, 0)

      // Near the top the row is always shown, whichever way we are moving.
      if (y < offset) {
        lastY.current = y
        apply(true)
        return
      }

      const delta = y - lastY.current

      // Ignore small movements, and do not move the reference point until one
      // is large enough to act on, so slow scrolls still accumulate.
      if (Math.abs(delta) < threshold) return

      lastY.current = y
      apply(delta < 0)
    }

    // Coalesce bursts of scroll events into one measurement per frame.
    const onScroll = () => {
      if (frame.current) return
      frame.current = requestAnimationFrame(measure)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame.current) cancelAnimationFrame(frame.current)
    }
  }, [offset, threshold])

  return visible
}
