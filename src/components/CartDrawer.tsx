import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatPrice, getProduct, type CartLine, type Product } from '../data'
import { FREE_DELIVERY_OVER, STANDARD_FEE } from '../lib/delivery'
import { optionTags } from '../lib/itemTypes'
import { VariantSheet } from './VariantSheet'
import { describeAmount, itemListPrice, variantsFor } from '../lib/packaging'
import { OpenBadge } from './OpenBadge'
import { ProductImage } from './ProductImage'
import { StoreLogo } from './StoreLogo'

export function CartDrawer() {
  const {
    cartOpen,
    closeCart,
    cartLines,
    cartTotal,
    cartStore,
    setQuantity,
    setVariant,
    removeFromCart,
    clearStoreCart,
  } = useApp()
  const navigate = useNavigate()
  const [editing, setEditing] = useState<string | null>(null)

  if (!cartOpen) return null

  const lines = cartLines
    .map((item) => ({ item, product: getProduct(item.productId) }))
    .filter((line): line is { item: typeof line.item; product: NonNullable<typeof line.product> } =>
      Boolean(line.product),
    )

  // Subtotal is what the products cost before any sale, so the discount the
  // shopper is getting shows up as its own line rather than disappearing.
  const subtotal = lines.reduce(
    (sum, { item, product }) => sum + itemListPrice(product, item.units) * item.quantity,
    0,
  )
  const editingLine = lines.find((line) => line.item.lineId === editing)
  const discount = subtotal - cartTotal
  const delivery = cartTotal >= FREE_DELIVERY_OVER ? 0 : STANDARD_FEE
  const total = cartTotal + delivery

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
      <aside className="flex h-full w-full max-w-md flex-col bg-surface shadow-xl">
        <header className="flex items-center gap-2 border-b border-line bg-white px-4 py-3.5">
          <button
            type="button"
            onClick={closeCart}
            className="-ml-1.5 rounded-lg p-1.5 text-ink transition-colors hover:bg-surface"
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
          <h2 className="flex-1 text-center text-base font-bold text-ink">Your cart</h2>
          {lines.length > 0 ? (
            <button
              type="button"
              onClick={() => cartStore && clearStoreCart(cartStore.id)}
              className="rounded-lg px-1.5 py-1 text-sm font-semibold text-muted transition-colors hover:text-sale"
            >
              Clear
            </button>
          ) : (
            <span className="w-10" />
          )}
        </header>

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
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {/* One pharmacy per order, so the cart says whose order this is. */}
              {cartStore && (
                <Link
                  to={`/store/${cartStore.id}`}
                  onClick={closeCart}
                  className="card flex items-center gap-3 p-3 transition-colors hover:border-navy"
                >
                  <StoreLogo store={cartStore} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{cartStore.name}</p>
                    <p className="truncate text-xs text-muted">
                      {cartStore.branch} · delivering this order
                    </p>
                    <OpenBadge store={cartStore} />
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-muted" />
                </Link>
              )}

              <ul className="card divide-y divide-line">
                {lines.map(({ item, product }) => (
                  <li key={item.lineId} className="flex gap-3 p-3">
                    <Link to={`/product/${product.id}`} onClick={closeCart} className="shrink-0">
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
                      {/* The variant is the one part of a line that can be
                          changed here: tapping it opens the shop's list. */}
                      {variantsFor(product, item.size).length > 1 ? (
                        <button
                          type="button"
                          onClick={() => setEditing(item.lineId)}
                          aria-haspopup="dialog"
                          aria-label={`Change variant of ${product.name}, currently ${describeLine(item, product)}`}
                          className="mt-1 inline-flex max-w-full items-center gap-1.5 rounded-full border border-line bg-surface py-1 pl-3 pr-2 text-left text-xs font-medium text-ink transition-colors hover:border-navy hover:text-navy"
                        >
                          <span className="truncate">{describeLine(item, product)}</span>
                          <ChevronDown size={15} className="shrink-0 text-navy" />
                        </button>
                      ) : (
                        <p className="mt-0.5 text-xs text-muted">{describeLine(item, product)}</p>
                      )}
                      {optionTags(item, product).length > 0 && (
                        <ul className="mt-1 flex flex-wrap gap-1">
                          {optionTags(item, product).map((tag) => (
                            <li
                              key={tag}
                              className="rounded-full bg-navy-tint px-2 py-0.5 text-[11px] font-medium text-navy"
                            >
                              {tag}
                            </li>
                          ))}
                        </ul>
                      )}
                      {item.note && (
                        <p className="mt-0.5 truncate text-xs italic text-teal">“{item.note}”</p>
                      )}
                      <p className="mt-0.5 text-sm font-bold text-navy">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end justify-between">
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.lineId)}
                        className="rounded-lg p-1 text-muted transition-colors hover:text-sale"
                        aria-label={`Remove ${product.name}`}
                      >
                        <Trash2 size={16} />
                      </button>

                      <div className="flex items-center rounded-full border border-line bg-white">
                        <button
                          type="button"
                          className="p-1.5 text-muted hover:text-navy"
                          onClick={() => setQuantity(item.lineId, item.quantity - 1)}
                          aria-label={`Decrease quantity of ${product.name}`}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="min-w-5 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="p-1.5 text-muted hover:text-navy"
                          onClick={() => setQuantity(item.lineId, item.quantity + 1)}
                          aria-label={`Increase quantity of ${product.name}`}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <section className="card p-4">
                <h3 className="mb-3 text-sm font-bold text-ink">Order summary</h3>
                <dl className="space-y-2 text-sm">
                  <SummaryRow label="Subtotal" value={formatPrice(subtotal)} />
                  <SummaryRow
                    label="Delivery fee"
                    value={delivery === 0 ? 'Free' : formatPrice(delivery)}
                  />
                  {discount > 0 && (
                    <SummaryRow
                      label="Discount"
                      value={`−${formatPrice(discount)}`}
                      tone="sale"
                    />
                  )}
                </dl>
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                  <span className="text-base font-bold text-ink">Total</span>
                  <span className="text-base font-bold text-ink">{formatPrice(total)}</span>
                </div>
                {delivery > 0 && (
                  <p className="mt-2 text-xs text-muted">
                    Spend {formatPrice(FREE_DELIVERY_OVER - cartTotal)} more for free delivery.
                  </p>
                )}
              </section>

            </div>

            <div className="border-t border-line bg-white p-4">
              {/* The order is placed on /checkout, where the address, delivery
                  option and payment method are settled. */}
              <button
                type="button"
                onClick={() => {
                  closeCart()
                  navigate('/checkout')
                }}
                className="btn-primary w-full rounded-full py-3"
              >
                Proceed to payment — {formatPrice(total)}
                <ArrowRight size={18} />
              </button>
            </div>
          </>
        )}
      </aside>

      {editingLine && (
        <VariantSheet
          line={editingLine.item}
          product={editingLine.product}
          onChoose={(variant) => {
            setVariant(editingLine.item.lineId, variant)
            setEditing(null)
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function SummaryRow({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'sale'
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className={`font-semibold ${tone === 'sale' ? 'text-sale' : 'text-ink'}`}>{value}</dd>
    </div>
  )
}

/** "Full box · 20 tablets" — how this line was put together. */
function describeLine(item: CartLine, product: Product): string {
  if (product.unit === 'item') return 'Single item'
  return describeAmount(product, item.packaging, item.units, item.size)
}
