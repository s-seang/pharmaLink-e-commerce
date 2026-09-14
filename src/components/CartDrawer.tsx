import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { finalPrice, formatPrice, getProduct, getStore } from '../data'
import { ProductImage } from './ProductImage'

export function CartDrawer() {
  const { cartOpen, closeCart, cart, cartTotal, setQuantity, removeFromCart, clearCart } = useApp()

  if (!cartOpen) return null

  const lines = cart
    .map((item) => ({ item, product: getProduct(item.productId) }))
    .filter((line): line is { item: typeof line.item; product: NonNullable<typeof line.product> } =>
      Boolean(line.product),
    )

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-end bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label="Cart"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeCart()
      }}
    >
      <aside className="flex h-full w-full max-w-sm flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            <ShoppingCart size={18} className="text-navy" />
            Your cart
          </h2>
          <button
            type="button"
            onClick={closeCart}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-ink"
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <ShoppingCart size={36} className="text-line" />
            <p className="text-sm text-muted">Your cart is empty.</p>
            <Link to="/search" onClick={closeCart} className="btn-primary">
              Browse products
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto">
              {lines.map(({ item, product }) => {
                const store = getStore(product.storeId)
                return (
                  <li key={product.id} className="flex gap-3 p-4">
                    <Link to={`/product/${product.id}`} onClick={closeCart}>
                      <ProductImage
                        product={product}
                        rounded="rounded-lg"
                        className="h-16 w-16 border border-line"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/product/${product.id}`}
                        onClick={closeCart}
                        className="line-clamp-2 text-sm font-semibold text-ink hover:text-navy"
                      >
                        {product.name}
                      </Link>
                      <p className="mt-0.5 truncate text-xs text-muted">{store?.name}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex items-center rounded-lg border border-line">
                          <button
                            type="button"
                            className="p-1.5 text-muted hover:text-navy"
                            onClick={() => setQuantity(product.id, item.quantity - 1)}
                            aria-label={`Decrease quantity of ${product.name}`}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="min-w-6 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            className="p-1.5 text-muted hover:text-navy"
                            onClick={() => setQuantity(product.id, item.quantity + 1)}
                            aria-label={`Increase quantity of ${product.name}`}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="text-sm font-semibold text-navy">
                          {formatPrice(finalPrice(product) * item.quantity)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(product.id)}
                      className="self-start rounded-lg p-1.5 text-muted transition-colors hover:text-sale"
                      aria-label={`Remove ${product.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                )
              })}
            </ul>

            <div className="space-y-3 border-t border-line p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="text-base font-semibold text-ink">{formatPrice(cartTotal)}</span>
              </div>
              <button type="button" className="btn-primary w-full">
                Checkout
              </button>
              <button
                type="button"
                onClick={clearCart}
                className="w-full text-xs font-medium text-muted hover:text-sale"
              >
                Clear cart
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
