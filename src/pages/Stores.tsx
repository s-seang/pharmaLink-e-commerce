import { ArrowLeft, Search as SearchIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { StoreRow } from '../components/StoreRow'
import { useApp } from '../context/AppContext'
import { openFirst, STORE_FILTERS, stores, type StoreType } from '../data'
import { distanceKm } from '../lib/geo'

type SortKey = 'distance' | 'rating'

export default function Stores() {
  const navigate = useNavigate()
  const { coords, now } = useApp()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('distance')

  const typeParam = params.get('type')
  const type: StoreType | 'All' = (STORE_FILTERS as string[]).includes(typeParam ?? '')
    ? (typeParam as StoreType)
    : 'All'

  const setType = (next: StoreType | 'All') => {
    const merged = new URLSearchParams(params)
    if (next === 'All') merged.delete('type')
    else merged.set('type', next)
    setParams(merged, { replace: true })
  }

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase()

    return stores
      .map((store) => ({ store, km: distanceKm(coords, store) }))
      .filter(({ store }) => type === 'All' || store.type === type)
      .filter(
        ({ store }) =>
          !needle ||
          store.name.toLowerCase().includes(needle) ||
          store.branch.toLowerCase().includes(needle) ||
          store.address.toLowerCase().includes(needle),
      )
      .sort(
        (a, b) =>
          openFirst(a.store, b.store, now) ||
          (sort === 'distance' ? a.km - b.km : b.store.rating - a.store.rating),
      )
  }, [coords, query, sort, type, now])

  return (
    <Layout header="none">
      <div className="sticky top-0 z-40 border-b border-line bg-white">
        <div className="app-container flex items-center gap-3 py-3 pr-14">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="-ml-1 rounded-lg p-1.5 text-navy-deep transition-colors hover:bg-navy-tint"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="flex-1 text-base font-semibold text-ink">All pharmacies</h1>
        </div>

        <div className="app-container pb-3">
          <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2.5">
            <SearchIcon size={17} className="shrink-0 text-navy" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search pharmacy or area"
              aria-label="Search pharmacies"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
            />
          </div>

          <div className="no-scrollbar mt-2.5 flex items-center gap-2 overflow-x-auto">
            <span className="shrink-0 text-xs font-semibold text-muted">Filter by store:</span>
            {(['All', ...STORE_FILTERS] as (StoreType | 'All')[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setType(option)}
                className={`chip ${type === option ? 'chip-active' : ''}`}
                aria-pressed={type === option}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="mt-2 flex gap-2">
            {(['distance', 'rating'] as SortKey[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSort(option)}
                className={`chip ${sort === option ? 'chip-active' : ''}`}
                aria-pressed={sort === option}
              >
                {option === 'distance' ? 'Nearest first' : 'Top rated'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="app-container py-4">
        <p className="mb-3 text-xs text-muted">
          {rows.length} {rows.length === 1 ? 'pharmacy' : 'pharmacies'}
        </p>

        {rows.length === 0 ? (
          <p className="card px-4 py-10 text-center text-sm text-muted">
            No pharmacy matched “{query}”.
          </p>
        ) : (
          <div className="grid gap-2.5 lg:grid-cols-2 xl:grid-cols-3">
            {rows.map(({ store, km }) => (
              <StoreRow key={store.id} store={store} distanceKm={km} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
