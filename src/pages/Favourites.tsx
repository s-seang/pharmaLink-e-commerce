import { ChevronLeft, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { ProductCard } from '../components/ProductCard'
import { useApp } from '../context/AppContext'
import { getProduct } from '../data'

/** Everything the heart on a product card has been saving up until now. */
export default function Favourites() {
  const { favourites } = useApp()
  const saved = favourites.flatMap((id) => getProduct(id) ?? [])

  return (
    <Layout header="none" floatingCart={false}>
      <header className="sticky top-0 z-40 border-b border-line bg-white">
        <div className="app-container flex items-center gap-2 py-3">
          <Link
            to="/account"
            aria-label="Back to your account"
            className="-ml-1.5 rounded-lg p-1.5 text-ink transition-colors hover:bg-surface"
          >
            <ChevronLeft size={22} />
          </Link>
          <h1 className="flex-1 text-center text-base font-bold text-ink">Favourites</h1>
          <span className="w-9 shrink-0" aria-hidden="true" />
        </div>
      </header>

      <div className="app-container min-h-screen py-5">
        {saved.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
            <Heart size={36} className="text-line" />
            <p className="text-sm font-semibold text-ink">Nothing saved yet</p>
            <p className="max-w-xs text-xs text-muted">
              Tap the heart on any product and it will wait for you here.
            </p>
            <Link to="/search" className="btn-primary mt-1">
              Browse products
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-4 text-xs text-muted">
              {saved.length} {saved.length === 1 ? 'product' : 'products'} saved
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4">
              {saved.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
