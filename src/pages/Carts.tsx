import { Bike, ChevronLeft, Plus, ShoppingCart, Tag, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { OpenBadge } from '../components/OpenBadge'
import { ProductImage } from '../components/ProductImage'
import { StoreLogo } from '../components/StoreLogo'
import { useApp } from '../context/AppContext'
import { formatPrice, getProduct } from '../data'
import { deliveryMinutes, distanceKm, formatEta } from '../lib/geo'
import { itemListPrice, roundMoney } from '../lib/packaging'

/**
 * Every basket the shopper has going, one card per pharmacy.
 *
 * Baskets are kept apart rather than merged because an order is placed with a
 * single shop — so picking something up from a second pharmacy starts its own
 * basket instead of asking anyone to give up the first.
 */
export default function Carts() {
  const { carts, address, coords, setActiveStore, openCart, clearStoreCart } = useApp()
  const navigate = useNavigate()

  const open = (storeId: string) => {
    setActiveStore(storeId)
    openCart()
  }

  return (
    <Layout header="none" floatingCart={false} background="tint">
      <header className="sticky top-0 z-40 border-b border-line bg-white">
        <div className="app-container flex items-center gap-2 py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="-ml-1.5 rounded-lg p-1.5 text-ink transition-colors hover:bg-surface"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-bold text-ink">All carts</h1>
            <p className="truncate text-xs text-muted">Deliver to: {address.line1}</p>
          </div>
        </div>
      </header>

      <div className="app-container max-w-md space-y-3 py-4">
        {carts.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
            <ShoppingCart size={36} className="text-line" />
            <p className="text-sm font-semibold text-ink">You have no carts yet</p>
            <Link to="/search" className="btn-primary mt-1">
              Browse products
            </Link>
          </div>
        ) : (
          carts.map(({ store, lines, count, total }) => {
            const before = lines.reduce((sum, item) => {
              const product = getProduct(item.productId)
              return product ? sum + itemListPrice(product, item.units) * item.quantity : sum
            }, 0)
            const saving = roundMoney(before - total)
            const eta = formatEta(deliveryMinutes(store.prepMinutes, distanceKm(coords, store)))

            return (
              <section key={store.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <Link to={`/store/${store.id}`} className="shrink-0">
                    <StoreLogo store={store} size={40} />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/store/${store.id}`}
                      className="block truncate text-sm font-bold text-ink hover:text-navy"
                    >
                      {store.name} ({store.branch})
                    </Link>
                    <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Bike size={12} className="text-navy" />
                        {eta}
                      </span>
                      {store.freeDelivery && (
                        <span className="font-semibold text-teal">Free delivery</span>
                      )}
                    </p>
                    <OpenBadge store={store} detail className="mt-0.5" />
                  </div>

                  <button
                    type="button"
                    onClick={() => clearStoreCart(store.id)}
                    aria-label={`Empty your ${store.name} cart`}
                    className="-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:text-sale"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* What is in it, as a row of thumbnails — the detail lives in
                    the cart itself. */}
                <div className="mt-3 flex items-center gap-2">
                  {lines.slice(0, 4).map(({ lineId, productId }) => {
                    const product = getProduct(productId)
                    return product ? (
                      <ProductImage
                        key={lineId}
                        product={product}
                        rounded="rounded-lg"
                        className="h-12 w-12 shrink-0 border border-line"
                      />
                    ) : null
                  })}

                  <Link
                    to={`/store/${store.id}`}
                    aria-label={`Add more from ${store.name}`}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line text-navy transition-colors hover:border-navy"
                  >
                    <Plus size={18} />
                  </Link>

                  {lines.length > 4 && (
                    <span className="text-xs text-muted">+{lines.length - 4} more</span>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  {saving > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sale/10 px-2.5 py-1 text-xs font-semibold text-sale">
                      <Tag size={12} />
                      Saving {formatPrice(saving)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted">
                      {count} {count === 1 ? 'item' : 'items'}
                    </span>
                  )}

                  <span className="flex items-baseline gap-2">
                    {saving > 0 && (
                      <span className="text-xs text-muted line-through">
                        {formatPrice(before)}
                      </span>
                    )}
                    <span className="text-base font-bold text-navy">{formatPrice(total)}</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => open(store.id)}
                  className="btn-outline mt-3 w-full"
                >
                  View your cart
                </button>
              </section>
            )
          })
        )}
      </div>
    </Layout>
  )
}
