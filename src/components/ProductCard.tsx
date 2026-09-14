import { Phone, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { finalPrice, formatPrice, getStore, type Product } from '../data'
import { telHref } from '../lib/geo'
import { ProductImage } from './ProductImage'
import { StarRating } from './StarRating'

/**
 * The product card shared by /search, /store/:id and /discounts.
 * `description="full"` is used on /discounts, which shows the whole blurb.
 */
export function ProductCard({
  product,
  description = 'summary',
}: {
  product: Product
  description?: 'summary' | 'full' | 'none'
}) {
  const { addToCart } = useApp()
  const store = getStore(product.storeId)
  const discounted = (product.discountPercent ?? 0) > 0
  const price = finalPrice(product)

  return (
    <article className="card flex h-full flex-col overflow-hidden transition-colors hover:border-navy">
      <Link to={`/product/${product.id}`} className="relative block">
        <ProductImage product={product} className="aspect-square w-full" />
        {discounted && (
          <span className="absolute left-2 top-2 rounded-md bg-sale px-2 py-1 text-xs font-bold text-white">
            -{product.discountPercent}%
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Link
          to={`/product/${product.id}`}
          className="line-clamp-2 text-sm font-semibold leading-snug text-ink hover:text-navy"
        >
          {product.name}
        </Link>

        {description !== 'none' && (
          <p className={`text-xs text-muted ${description === 'summary' ? 'line-clamp-1' : ''}`}>
            {description === 'summary' ? product.summary : product.description}
          </p>
        )}

        {store && (
          <>
            <Link
              to={`/store/${store.id}`}
              className="truncate text-xs font-medium text-teal hover:underline"
            >
              {store.name}
            </Link>
            {/* The rating is the store's — products are not rated. */}
            <StarRating rating={store.rating} reviewCount={store.reviewCount} />
          </>
        )}

        <div className="mt-auto pt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-navy">{formatPrice(price)}</span>
            {discounted && (
              <span className="text-xs text-muted line-through">{formatPrice(product.price)}</span>
            )}
          </div>

          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => addToCart(product.id)}
              className="btn-primary flex-1 px-2 py-2 text-xs"
            >
              <ShoppingCart size={15} />
              Add to cart
            </button>
            {store && (
              <a
                href={telHref(store.phone)}
                className="btn-teal-outline shrink-0 px-2.5 py-2"
                aria-label={`Call ${store.name} on ${store.phone}`}
                title={`Call ${store.name}`}
              >
                <Phone size={15} />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
