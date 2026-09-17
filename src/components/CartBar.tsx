import { useApp, type StoreCart } from '../context/AppContext'
import { formatPrice, getProduct } from '../data'
import { itemListPrice } from '../lib/packaging'

/**
 * Bottom bar summarising the cart. It is the last thing inside `<main>`, and it
 * is `sticky`, not `fixed`: the browser pins it to the bottom of the screen for
 * as long as the page body is in view, then lets it come to rest at the end of
 * the body — directly on top of the footer — and ride it from there.
 *
 * Sticky rather than a measured offset on purpose. A fixed bar repositioned
 * from a scroll handler lands a frame late on every scroll, which is what makes
 * one look like it is drifting rather than sitting still. This one is laid out
 * by the compositor, so it cannot lag. Being in the flow also means it reserves
 * its own height at the foot of the page, so it never buries the last row of
 * products the way an out-of-flow bar does.
 *
 * It summarises one pharmacy's basket — the shop whose page this is — since
 * each shop's basket is checked out on its own.
 */
export function CartBar({ basket }: { basket: StoreCart }) {
  const { setActiveStore, openCart } = useApp()
  const { store: cartStore, lines, count: cartCount, total: cartTotal } = basket

  const before = lines.reduce((sum, item) => {
    const product = getProduct(item.productId)
    return product ? sum + itemListPrice(product, item.units) * item.quantity : sum
  }, 0)
  const saving = before > cartTotal

  return (
    <div data-cart-bar className="sticky bottom-4 z-40 mt-6 px-4">
      <div className="app-container px-0">
        <button
          type="button"
          onClick={() => {
            setActiveStore(cartStore.id)
            openCart()
          }}
          className="flex w-full items-center gap-3 rounded-2xl bg-navy px-4 py-3 text-white shadow-lg transition-colors hover:bg-navy-deep"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-bold">
            {cartCount}
          </span>

          <span className="min-w-0 flex-1 text-center">
            <span className="block text-base font-bold leading-tight">View your cart</span>
            <span className="block truncate text-xs text-white/75">
              {cartStore.name} ({cartStore.branch})
            </span>
          </span>

          <span className="shrink-0 text-right">
            <span className="block text-base font-bold leading-tight">
              {formatPrice(cartTotal)}
            </span>
            {saving && (
              <span className="block text-xs text-white/70 line-through">
                {formatPrice(before)}
              </span>
            )}
          </span>
        </button>
      </div>
    </div>
  )
}
