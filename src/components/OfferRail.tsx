import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { bestDiscount, leadingCategory, stores, type Store } from '../data'
import { StoreLogo } from './StoreLogo'

/** Offers run to the end of the month — the same date for every shop. */
function expiresOn(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * The deals a shopper can act on today, as tear-off coupons: who is running it
 * on the left, what it is worth on the right.
 *
 * Built from the catalogue rather than a separate offers table — a shop's
 * headline number is simply the deepest discount it is actually running.
 */
export function OfferRail() {
  const rail = useRef<HTMLDivElement>(null)

  const offers = stores
    .map((store) => ({ store, percent: bestDiscount(store.id) }))
    .filter((offer) => offer.percent > 0)
    .sort((a, b) => b.percent - a.percent)

  if (offers.length === 0) return null

  const scroll = (direction: 1 | -1) =>
    rail.current?.scrollBy({ left: direction * 300, behavior: 'smooth' })

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="section-title">Popular offer of the day</h2>

        <div className="flex shrink-0 gap-2">
          {([-1, 1] as const).map((direction) => (
            <button
              key={direction}
              type="button"
              onClick={() => scroll(direction)}
              aria-label={direction === -1 ? 'Previous offers' : 'More offers'}
              className="rounded-md bg-navy-tint p-1.5 text-navy transition-colors hover:bg-navy hover:text-white"
            >
              {direction === -1 ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          ))}
        </div>
      </div>

      <div ref={rail} className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
        {offers.map(({ store, percent }) => (
          <OfferCoupon key={store.id} store={store} percent={percent} />
        ))}
      </div>
    </section>
  )
}

function OfferCoupon({ store, percent }: { store: Store; percent: number }) {
  const sells = leadingCategory(store)

  return (
    <article className="flex w-[19rem] shrink-0 overflow-hidden rounded-card border border-line bg-white">
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 p-4">
        <div className="flex items-center gap-2">
          <StoreLogo store={store} size={28} />
          <span className="truncate text-xs font-semibold text-muted">{store.branch}</span>
        </div>
        <p className="text-sm font-bold leading-snug text-ink">
          {store.name}: up to {percent}% off
          {sells ? ` on ${sells.toLowerCase()}` : ''}
        </p>
      </div>

      {/* The tear line: two bites out of the seam, in the left half's colour. */}
      <div className="relative w-[8.5rem] shrink-0 bg-navy px-3 py-4 text-center text-white">
        <span
          aria-hidden="true"
          className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-white"
        />
        <span
          aria-hidden="true"
          className="absolute -bottom-3 -left-3 h-6 w-6 rounded-full bg-white"
        />

        <p className="text-3xl font-extrabold leading-none">{percent}%</p>
        <p className="text-xs font-semibold tracking-widest">OFF</p>
        <p className="mt-1.5 text-[10px] text-white/70">Expires on {expiresOn()}</p>

        <Link
          to={`/store/${store.id}`}
          className="mt-2.5 inline-flex rounded-md bg-white px-3 py-1.5 text-xs font-bold tracking-wide text-navy transition-colors hover:bg-navy-tint"
        >
          Get Deal
        </Link>
      </div>
    </article>
  )
}
