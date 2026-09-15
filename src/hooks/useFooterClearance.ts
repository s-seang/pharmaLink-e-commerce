import { useEffect, useState } from 'react'

/** Bottom-anchored things a floating control has to stay above. */
const OBSTACLES = ['[data-cart-bar]', '[data-app-footer]']

/**
 * How far a viewport-fixed control must lift to clear whatever is anchored to
 * the bottom of the page. Returns 0 until an obstacle intrudes, then grows with
 * the overlap so the control rests just above it instead of floating over it.
 *
 * Only for genuinely fixed controls. Anything that can be laid out in the flow
 * should use `position: sticky` instead, which the compositor keeps in place
 * without a scroll handler — see `CartBar`.
 */
export function useFooterClearance(gap = 16): number {
  const [lift, setLift] = useState(0)

  useEffect(() => {
    let frame = 0

    const measure = () => {
      frame = 0

      const overlap = OBSTACLES.reduce((worst, selector) => {
        const element = document.querySelector(selector)
        if (!element) return worst
        return Math.max(worst, window.innerHeight - element.getBoundingClientRect().top + gap)
      }, 0)

      const next = Math.max(0, Math.round(overlap))
      setLift((current) => (current === next ? current : next))
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [gap])

  return lift
}
