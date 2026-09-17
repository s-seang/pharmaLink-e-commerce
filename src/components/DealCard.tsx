import { Plus, ShoppingCart, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { finalPrice, formatPrice, getStore, type Product } from '../data'
import { useVariantBasket } from '../hooks/useVariantBasket'
import { variantsFor } from '../lib/packaging'
import { ProductImage } from './ProductImage'

/**
 * A product on offer, boxed: what it saves you in the corner, then the picture,
 * who sells it, and an add button on the price line.
 *
 * Distinct from the browse card on purpose — the discount is the reason this
 * card exists, so it leads, and the add sits next to the price rather than
 * floating over the artwork.
 */
export function DealCard({ product }: { product: Product }) {
  const { addToCart, defaultLine } = useApp()
  const store = getStore(product.storeId)
  const line = defaultLine(product.id)

  const { setQuantityOf } = useVariantBasket(product, line)
  const variants = variantsFor(product)
  const soldOut = variants.every((variant) => variant.soldOut)

  const add = () => {
    if (soldOut) return
    // One tap, one of whatever this product leads with.
    if (variants.length > 1 && !line) setQuantityOf(variants[0], 1)
    else addToCart(product.id)
  }

  return (
    <article className="card relative flex flex-col overflow-hidden">
      <span className="absolute left-0 top-0 z-10 rounded-br-card bg-sale px-2.5 py-1 text-xs font-bold text-white">
        {product.discountPercent}%
      </span>

      {soldOut && (
        <span className="absolute right-0 top-0 z-10 rounded-bl-card bg-muted px-2.5 py-1 text-[11px] font-semibold text-white">
          Out of stock
        </span>
      )}

      <Link to={`/product/${product.id}`} aria-label={product.name}>
        <ProductImage product={product} rounded="rounded-none" className="aspect-square w-full" />
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <p className="text-[11px] uppercase tracking-wide text-muted">{product.category}</p>

        <Link
          to={`/product/${product.id}`}
          className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-ink hover:text-navy"
        >
          {product.name}
        </Link>

        {store && (
          <>
            <span className="mt-1 flex items-center gap-1 text-xs text-muted">
              <Star size={12} className="text-star" fill="currentColor" />
              {store.rating.toFixed(1)}
              <span className="text-line">({store.reviewCount})</span>
            </span>

            <Link
              to={`/store/${store.id}`}
              className="mt-0.5 truncate text-xs font-medium text-teal hover:underline"
            >
              By {store.name}
            </Link>
          </>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-2.5">
          <p className="min-w-0">
            <span className="block text-base font-bold text-navy">
              {formatPrice(finalPrice(product))}
            </span>
            <span className="text-xs text-muted line-through">{formatPrice(product.price)}</span>
          </p>

          <button
            type="button"
            onClick={add}
            disabled={soldOut}
            aria-label={`Add ${product.name} to cart`}
            className="flex shrink-0 items-center gap-1 rounded-lg bg-teal-tint px-2.5 py-2 text-xs font-bold text-teal transition-colors hover:bg-teal hover:text-white disabled:opacity-40 disabled:hover:bg-teal-tint disabled:hover:text-teal"
          >
            {line ? <ShoppingCart size={14} /> : <Plus size={14} />}
            {line ? `${line.quantity} in cart` : 'Add'}
          </button>
        </div>
      </div>
    </article>
  )
}
