import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { banners } from '../data/banners'

/**
 * Promotional banners. Deliberately manual — it never scrolls on its own. The
 * bar underneath is a scroll position indicator, not a set of dots: its thumb
 * is one banner wide and slides as you swipe.
 */
export function BannerCarousel() {
  const railRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return

    let frame = 0

    const measure = () => {
      frame = 0
      const scrollable = rail.scrollWidth - rail.clientWidth
      setProgress(scrollable > 0 ? rail.scrollLeft / scrollable : 0)
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }

    measure()
    rail.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      rail.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  const thumbWidth = 100 / banners.length

  return (
    <div>
      <div
        ref={railRef}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1"
      >
        {banners.map((banner) => (
          <Link
            key={banner.id}
            to={banner.to}
            className="relative w-[85%] shrink-0 snap-start overflow-hidden rounded-card sm:w-[55%] lg:w-[40%]"
            style={{ backgroundColor: banner.background, color: banner.foreground }}
          >
            {/* Decorative shapes, so the banner reads as artwork rather than a block. */}
            <svg
              className="pointer-events-none absolute inset-y-0 right-0 h-full"
              viewBox="0 0 160 120"
              preserveAspectRatio="xMaxYMid slice"
              aria-hidden="true"
            >
              <circle cx="130" cy="30" r="52" fill={banner.accent} opacity="0.35" />
              <circle cx="150" cy="96" r="34" fill={banner.accent} opacity="0.55" />
            </svg>

            <div className="relative flex aspect-[16/7] flex-col justify-center gap-1 p-5">
              <p className="text-base font-bold leading-snug sm:text-lg">{banner.headline}</p>
              <p className="text-xs opacity-80">{banner.subline}</p>
              <span
                className="mt-2 inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: banner.foreground, color: banner.background }}
              >
                {banner.cta}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div
        className="mx-auto mt-3 h-1 w-28 overflow-hidden rounded-full bg-line"
        role="presentation"
      >
        <div
          className="h-full rounded-full bg-navy transition-[margin] duration-75"
          style={{
            width: `${thumbWidth}%`,
            marginLeft: `${progress * (100 - thumbWidth)}%`,
          }}
        />
      </div>
    </div>
  )
}
