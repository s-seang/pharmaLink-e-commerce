import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { banners } from '../data/banners'

/**
 * The supplied promotional artwork. Deliberately manual — it never scrolls on
 * its own. The bar underneath is a scroll position indicator, not a set of
 * dots: its thumb is one banner wide and slides as you swipe.
 *
 * The rail stays inside the page gutter rather than bleeding to the screen
 * edge, so a banner lines up with the sections above and below it. One banner
 * fills the column at a time; the rest are a swipe away.
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
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1"
      >
        {banners.map((banner) => (
          <Link
            key={banner.id}
            to={banner.to}
            className="w-full shrink-0 snap-start overflow-hidden rounded-card border border-line bg-white sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)]"
          >
            {/* Contained rather than cropped: these are marketing creatives, and
                a cover crop would cut the wording off the wide ones. */}
            <img
              src={banner.image}
              alt={banner.alt}
              className="aspect-[2/1] w-full object-contain"
            />
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
