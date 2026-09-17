import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { stores } from '../data'
import { useLoopingRail } from '../hooks/useLoopingRail'
import { StoreLogo } from './StoreLogo'

/**
 * The best-rated shops, as a row of marks to tap straight into.
 *
 * Purely by rating: this row answers who is good, and the "Nearest to you"
 * rail below already answers who is close.
 */
export function TopStores({ limit = 6 }: { limit?: number }) {
  const rail = useRef<HTMLDivElement>(null)
  useLoopingRail(rail, 4500)

  const top = [...stores].sort((a, b) => b.rating - a.rating).slice(0, limit)

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="section-title">Top pharmacies</h2>
        <Link to="/stores" className="shrink-0 text-sm font-semibold text-navy hover:underline">
          See all
        </Link>
      </div>

      <div ref={rail} className="no-scrollbar flex gap-4 overflow-x-auto pb-1">
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
