import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { bestDiscount, leadingCategory, stores, type Store } from '../data'
import { useDriftingRail } from '../hooks/useLoopingRail'
import { StoreLogo } from './StoreLogo'

/** Offers run to the end of the month — the same date for every shop. */
function expiresOn(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
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
  useDriftingRail(rail, 22, true)

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
        {/* Laid out twice: the rail wraps at the halfway mark, where the second
            run looks like the first, so the loop has no seam. The repeat is
            hidden from screen readers — each offer is announced once. */}
        {[...offers, ...offers].map(({ store, percent }, index) => (
          <div
            key={`${store.id}-${index}`}
            aria-hidden={index >= offers.length}
            className="contents"
          >
            <OfferCoupon store={store} percent={percent} index={index % offers.length} />
          </div>
        ))}
      </div>
    </section>
  )
}

/**
 * Stub colours, taken in turn so a row of coupons does not come out all one
 * shade. Each pairs a fill with the ink that reads on it.
 */
const STUBS = [
  { fill: '#4A9A96', ink: 'text-white', button: 'bg-white text-teal' },
  { fill: '#EF9F27', ink: 'text-ink', button: 'bg-ink text-white' },
  { fill: '#C2410C', ink: 'text-white', button: 'bg-white text-sale' },
  { fill: '#2B5C8A', ink: 'text-white', button: 'bg-white text-navy' },
] as const

function OfferCoupon({ store, percent, index }: { store: Store; percent: number; index: number }) {
  const sells = leadingCategory(store)
  const stub = STUBS[index % STUBS.length]

  return (
    <article className="relative flex h-40 w-[21rem] shrink-0">
      {/* The counterfoil: brand at the top, the offer spelled out, the shop's
          own mark standing in for the artwork. */}
      <div className="relative flex min-w-0 flex-1 items-center gap-3 rounded-l-xl bg-[#FBF8F0] p-4">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-2.5 rounded-lg border border-dashed border-ink/20"
        />

        <div className="relative min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold text-ink/70">{store.name}</p>

          <p className="mt-1 text-xl font-extrabold uppercase leading-[1.05] tracking-tight text-ink">
            Discount
            <br />
            Coupon
          </p>

          <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-ink/60">
            Valid until {expiresOn()}
          </p>
        </div>

        <StoreLogo store={store} size={72} className="relative shrink-0" />
      </div>

      {/* The tear-off, bitten out at both ends and perforated down the seam. */}
      <div
        className={`relative flex w-[7.5rem] shrink-0 flex-col items-center justify-center gap-0.5 rounded-r-xl ${stub.ink}`}
        style={{ backgroundColor: stub.fill }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-2.5 rounded-lg border border-dashed border-current opacity-40"
        />

        <p className="relative text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">
          Voucher
        </p>
        <p className="relative text-3xl font-extrabold leading-none">{percent}%</p>
        <p className="relative text-[11px] font-bold uppercase tracking-wide">Discount</p>

        <Link
          to={`/store/${store.id}`}
          className={`relative mt-2 rounded-full px-3 py-1 text-[11px] font-bold ${stub.button}`}
        >
          Get Deal
        </Link>
      </div>

      {/* Bites taken out of both outer edges, in the page's own colour. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-[7.5rem] w-px border-l-2 border-dashed border-white/70"
      />

      <p className="sr-only">
        {store.name}: up to {percent}% off{sells ? ` on ${sells.toLowerCase()}` : ''}
      </p>
    </article>
  )
}
