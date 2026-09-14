import { useEffect, useState } from 'react'

/**
 * How far a viewport-fixed control must lift to stay clear of the footer.
 * Returns 0 until the footer scrolls into view, then grows with the overlap so
 * the control comes to rest just above it instead of floating over it.
 */
export function useFooterClearance(gap = 16): number {
  const [lift, setLift] = useState(0)

  useEffect(() => {
    let frame = 0

    const measure = () => {
      frame = 0
      const footer = document.querySelector('[data-app-footer]')
      if (!footer) return

      const overlap = window.innerHeight - footer.getBoundingClientRect().top + gap
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
