import { Bike, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { bestDiscount, leadingCategory, type Store } from '../data'
import { deliveryMinutes, formatDistance, formatEta } from '../lib/geo'
import { useApp } from '../context/AppContext'
import { isOpenNow } from '../data'
import { OpenBadge } from './OpenBadge'

/**
 * A pharmacy as a full-width promotional card: a branded banner, then the
 * shop's name, rating and delivery facts underneath.
 *
 * The banner is drawn, not photographed. Stores have no artwork, and the rest
 * of the app already generates its imagery (`ProductImage`) rather than
 * depending on files that do not exist — so this paints the shop's own brand
 * colour and leads with whatever it has discounted deepest.
 */
export function StoreBannerCard({
  store,
  km,
  footnote,
}: {
  store: Store
  km: number
  /** Optional line under the card, e.g. when it was last ordered from. */
  footnote?: string
}) {
  const { now } = useApp()
  const discount = bestDiscount(store.id)
  const sells = leadingCategory(store)
  const shut = !isOpenNow(store, now)

  return (
    <Link
      to={`/store/${store.id}`}
      className={`group block ${shut ? 'opacity-60 hover:opacity-100' : ''}`}
    >
      <div
        className="relative overflow-hidden rounded-card"
        style={{ backgroundColor: store.logoColor }}
      >
        <svg
          className="pointer-events-none absolute inset-y-0 right-0 h-full"
          viewBox="0 0 160 120"
          preserveAspectRatio="xMaxYMid slice"
          aria-hidden="true"
        >
          <circle cx="132" cy="26" r="54" fill="#FFFFFF" opacity="0.12" />
          <circle cx="150" cy="98" r="36" fill="#FFFFFF" opacity="0.18" />
        </svg>

        <div className="relative flex aspect-[16/7] flex-col justify-center p-5 text-white">
          {discount > 0 ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-widest opacity-80">Up to</p>
              <p className="text-4xl font-extrabold leading-none">{discount}%</p>
              <p className="text-lg font-bold leading-tight">off</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-extrabold leading-tight">{store.initials}</p>
              <p className="text-sm font-semibold opacity-90">{sells ?? store.type}</p>
            </>
          )}
        </div>
      </div>

      {store.freeDelivery && (
        <p className="rounded-b-card bg-teal-tint px-3 py-1.5 text-xs font-bold text-teal">
          Free delivery voucher on this pharmacy
        </p>
      )}

      <div className="mt-2.5 flex items-start justify-between gap-3">
        <h3 className="min-w-0 text-base font-bold leading-snug text-ink group-hover:text-navy">
          {store.name} ({store.branch})
        </h3>
        <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-ink">
          <Star size={15} className="text-star" fill="currentColor" />
          {store.rating.toFixed(1)}
          <span className="font-normal text-muted">({store.reviewCount})</span>
        </span>
      </div>

      <p className="mt-0.5 text-sm text-muted">
        From {formatEta(deliveryMinutes(store.prepMinutes, km))} · {store.type}
        {sells ? ` · ${sells}` : ''}
      </p>

      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
        <Bike size={15} className="shrink-0 text-navy" />
        {formatDistance(km)} away
      </p>

      <OpenBadge store={store} className="mt-1" />

      {discount > 0 && (
        <span className="mt-2 inline-flex rounded-full bg-sale/10 px-2.5 py-1 text-sm font-semibold text-sale">
          Up to {discount}% off
        </span>
      )}

      {footnote && <p className="mt-2 text-xs text-muted">{footnote}</p>}
    </Link>
  )
}
