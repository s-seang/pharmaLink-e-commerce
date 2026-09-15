import { ShoppingBag, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { getProduct, type Store } from '../data'
import { StoreLogo } from './StoreLogo'

/**
 * An order belongs to one pharmacy, because each one packs and delivers its
 * own. When a shopper adds something from a second pharmacy the add is held
 * back and this asks them to choose: keep the cart they have, or empty it and
 * start again at the new pharmacy.
 */
export function CartStoreDialog() {
  const { cartConflict, confirmCartSwitch, cancelCartSwitch, cartCount } = useApp()

  if (!cartConflict) return null

  const { current, next, item } = cartConflict
  const product = getProduct(item.productId)

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-store-dialog-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) cancelCartSwitch()
      }}
    >
      <div className="w-full max-w-sm rounded-card bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-tint text-navy">
            <ShoppingBag size={20} />
          </span>
          <button
            type="button"
            onClick={cancelCartSwitch}
            className="-mr-1.5 -mt-1.5 rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-ink"
            aria-label="Keep my current cart"
          >
            <X size={20} />
          </button>
        </div>

        <h2 id="cart-store-dialog-title" className="mt-3 text-base font-bold text-ink">
          Start a new cart at {next.name}?
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          You can only order from one pharmacy at a time. Adding
          {product ? ` ${product.name}` : ' this product'} will remove the {cartCount}{' '}
          {cartCount === 1 ? 'item' : 'items'} already in your cart from {current.name}.
        </p>

        <div className="mt-4 space-y-2">
          <StoreLine store={current} note={`${cartCount} in cart — will be removed`} />
          <StoreLine store={next} note="New cart starts here" highlight />
        </div>

        <div className="mt-5 space-y-2">
          <button type="button" onClick={confirmCartSwitch} className="btn-primary w-full">
            Empty cart and add
          </button>
          <button type="button" onClick={cancelCartSwitch} className="btn-outline w-full">
            Keep my {current.name} cart
          </button>
        </div>
      </div>
    </div>
  )
}

function StoreLine({
  store,
  note,
  highlight = false,
}: {
  store: Store
  note: string
  highlight?: boolean
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-2.5 ${
        highlight ? 'border-navy bg-navy-tint/50' : 'border-line bg-surface'
      }`}
    >
      <StoreLogo store={store} size={36} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">{store.name}</p>
        <p className="truncate text-xs text-muted">{note}</p>
      </div>
    </div>
  )
}
