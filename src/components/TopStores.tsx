import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { openFirst, stores } from '../data'
import { StoreLogo } from './StoreLogo'

/**
 * The shops worth knowing about, as a row of marks to tap straight into.
 *
 * Ranked by rating rather than distance — this row is about who is good, and
 * the "Nearest to you" rail below already answers who is close. Open shops
 * still come first, since a shut one is no use however well rated.
 */
export function TopStores({ limit = 8 }: { limit?: number }) {
  const { now } = useApp()

  const top = [...stores]
    .sort((a, b) => openFirst(a, b, now) || b.rating - a.rating)
    .slice(0, limit)

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="section-title">Top pharmacies</h2>
        <Link to="/stores" className="shrink-0 text-sm font-semibold text-navy hover:underline">
          See all
        </Link>
      </div>

      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-1">
        {top.map((store) => (
          <Link
            key={store.id}
            to={`/store/${store.id}`}
            className="group flex w-20 shrink-0 flex-col items-center gap-1.5 text-center"
          >
            <StoreLogo
              store={store}
              size={60}
              className="border-line transition-colors group-hover:border-navy"
            />
            <span className="line-clamp-2 text-xs font-medium leading-tight text-ink group-hover:text-navy">
              {store.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
