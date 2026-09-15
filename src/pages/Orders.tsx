import { ChevronLeft, ShoppingBag } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { StoreBannerCard } from '../components/StoreBannerCard'
import { useApp } from '../context/AppContext'
import { orderedStores } from '../data'
import { distanceKm } from '../lib/geo'

/** "9 September 2026" — orders are rare enough to deserve the long form. */
function formatOrderDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function Orders() {
  const { orders, coords } = useApp()

  const shops = useMemo(() => orderedStores(orders), [orders])

  return (
    // No logo row, search bar or category chips: this page is one list, and
    // the only ways out of it are the shop cards and the arrow home.
    <Layout header="none" floatingCart={false}>
      <header className="sticky top-0 z-40 border-b border-line bg-white">
        <div className="app-container flex items-center gap-2 py-3">
          <Link
            to="/"
            aria-label="Back to home"
            className="-ml-1.5 rounded-lg p-1.5 text-ink transition-colors hover:bg-surface"
          >
            <ChevronLeft size={22} />
          </Link>
          <h1 className="flex-1 text-center text-base font-bold text-ink">Your previous orders</h1>
          {/* Balances the back button so the title sits truly centred. */}
          <span className="w-9 shrink-0" aria-hidden="true" />
        </div>
      </header>

      <div className="app-container py-5">
        {shops.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
            <ShoppingBag size={36} className="text-line" />
            <p className="text-sm font-semibold text-ink">You have not ordered yet</p>
            <p className="max-w-xs text-xs text-muted">
              Once you place an order, the pharmacy you bought from appears here so you can go
              straight back to it.
            </p>
            <Link to="/stores" className="btn-primary mt-1">
              Browse pharmacies
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-4 text-xs text-muted">
              {shops.length} {shops.length === 1 ? 'pharmacy' : 'pharmacies'} you have ordered from
            </p>
            <div className="space-y-8">
              {shops.map(({ store, lastOrderedOn }) => (
                <StoreBannerCard
                  key={store.id}
                  store={store}
                  km={distanceKm(coords, store)}
                  footnote={`Last ordered ${formatOrderDate(lastOrderedOn)}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
