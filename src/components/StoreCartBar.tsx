import { useApp } from '../context/AppContext'
import { finalPrice, formatPrice, getProduct, type Store } from '../data'

/**
 * Bottom bar summarising what the shopper has picked up from this store.
 * It replaces the floating cart button on store pages and only appears once
 * something from this store is in the cart.
 */
export function StoreCartBar({ store }: { store: Store }) {
  const { cart, openCart } = useApp()

  const lines = cart
    .map((item) => ({ item, product: getProduct(item.productId) }))
    .filter((line) => line.product?.storeId === store.id)

  if (lines.length === 0) return null

  const count = lines.reduce((total, { item }) => total + item.quantity, 0)
  const total = lines.reduce(
    (sum, { item, product }) => sum + finalPrice(product!) * item.quantity,
    0,
  )
  const before = lines.reduce((sum, { item, product }) => sum + product!.price * item.quantity, 0)

  return (
    <div data-store-cart-bar className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4">
      <div className="app-container px-0">
        <button
          type="button"
          onClick={openCart}
          className="flex w-full items-center gap-3 rounded-2xl bg-navy px-4 py-3 text-white shadow-lg transition-colors hover:bg-navy-deep"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-bold">
            {count}
          </span>

          <span className="min-w-0 flex-1 text-center">
            <span className="block text-base font-bold leading-tight">View your cart</span>
            <span className="block truncate text-xs text-white/75">
              {store.name} ({store.branch})
            </span>
          </span>

          <span className="shrink-0 text-right">
            <span className="block text-base font-bold leading-tight">{formatPrice(total)}</span>
            {before > total && (
              <span className="block text-xs text-white/70 line-through">{formatPrice(before)}</span>
            )}
          </span>
        </button>
      </div>
    </div>
  )
}
