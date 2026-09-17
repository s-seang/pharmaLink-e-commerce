import { useEffect, useState } from 'react'

/**
 * Whether a control pinned near the top of the viewport is still clear of the
 * footer.
 *
 * At the end of a long page the footer fills most of the screen, and a floating
 * button left over it reads as a stray. Callers fade the control out once this
 * returns false, so it stops at the footer rather than riding over it.
 */
export function useAboveFooter(controlHeight = 56): boolean {
  const [clear, setClear] = useState(true)

  useEffect(() => {
    let frame = 0

    const measure = () => {
      frame = 0
      const footer = document.querySelector('[data-app-footer]')
      if (!footer) {
        setClear(true)
        return
      }
      const next = footer.getBoundingClientRect().top > controlHeight
      setClear((current) => (current === next ? current : next))
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
  }, [controlHeight])

  return clear
}
