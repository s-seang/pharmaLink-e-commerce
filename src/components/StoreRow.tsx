import { ChevronRight, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Store } from '../data'
import { formatDistance } from '../lib/geo'
import { OpenBadge } from './OpenBadge'
import { StarRating } from './StarRating'

/** Fixed height, so rows line up whether stacked or laid out in a rail. */
const STORE_ROW_HEIGHT = 100

export function StoreRow({
  store,
  distanceKm,
  className = '',
}: {
  store: Store
  distanceKm: number
  /** Sizing from the caller — a sideways rail needs a fixed width per row. */
  className?: string
}) {
  return (
    <Link
      to={`/store/${store.id}`}
      style={{ height: STORE_ROW_HEIGHT }}
      className={`card flex items-center gap-3 p-3 transition-colors hover:border-navy ${className}`}
    >
      <StoreLogoMark store={store} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{store.name}</p>
        <p className="truncate text-xs text-muted">{store.branch}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            <MapPin size={12} className="text-navy" />
            {formatDistance(distanceKm)}
          </span>
          <OpenBadge store={store} />
        </div>
        <StarRating rating={store.rating} reviewCount={store.reviewCount} className="mt-1" />
      </div>

      <ChevronRight size={18} className="shrink-0 text-muted" />
    </Link>
  )
}

function StoreLogoMark({ store }: { store: Store }) {
  return (
    <span
      className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
      style={{ backgroundColor: store.logoColor }}
      aria-hidden="true"
    >
      {store.initials}
    </span>
  )
}
