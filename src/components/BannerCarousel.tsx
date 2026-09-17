import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLoopingRail } from '../hooks/useLoopingRail'
import { banners } from '../data/banners'

/**
 * The supplied promotional artwork, moving on by itself and looping back to
 * the first once the last is in view. The bar underneath is a scroll position
 * indicator, not a set of dots: its thumb is one banner wide.
 *
 * The rail stays inside the page gutter rather than bleeding to the screen
 * edge, so a banner lines up with the sections above and below it. One banner
 * fills the column at a time; the rest are a swipe away.
 */
export function BannerCarousel() {
  const railRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)

  useLoopingRail(railRef, 5000)

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
            {/* Filled rather than fitted, so no banner sits in white space.
                Anything wider than the frame is cropped from its far edge. */}
            <img
              src={banner.image}
              alt={banner.alt}
              className={`aspect-[2/1] w-full object-cover ${banner.position ?? ''}`}
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
