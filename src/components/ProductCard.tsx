import { Heart, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { finalPrice, formatPrice, getStore, type Product } from '../data'
import { itemListPrice, roundMoney } from '../lib/packaging'
import { CartStepper } from './CartStepper'
import { ProductImage } from './ProductImage'
import { StoreLogo } from './StoreLogo'

/**
 * The one product card the whole app uses — search, discounts, store pages and
 * the home grid. Artwork on top with the add button over it, then the pharmacy
 * selling it, then the name and pricing.
 *
 * The pharmacy line sits above the product name on purpose: the cart holds one
 * pharmacy at a time, so who is selling it is part of the decision, not a
 * footnote. The stars next to it are the store's — products are not rated.
 */
export function ProductCard({
  product,
  showStore = true,
  action = 'favourite',
}: {
  product: Product
  showStore?: boolean
  /**
   * The corner control on the artwork. `none` inside a pharmacy's own page,
   * where browsing one shelf should stay down to a single gesture — add.
   */
  action?: 'favourite' | 'none'
}) {
  const { toggleFavourite, isFavourite, defaultLine } = useApp()
  const store = getStore(product.storeId)
  const discounted = (product.discountPercent ?? 0) > 0
  const favourite = isFavourite(product.id)

  // Once it is in the cart the card quotes what was actually picked, so
  // switching to a strip on the stepper is reflected here rather than leaving
  // the shelf price sitting over a different variant.
  const line = defaultLine(product.id)
  const price = line ? line.price : finalPrice(product)
  const listPrice = line ? roundMoney(itemListPrice(product, line.units)) : product.price

  return (
    <article className="flex flex-col">
      {showStore && store && (
        <div className="mb-2 flex items-center gap-1.5">
          <Link
            to={`/store/${store.id}`}
            className="flex min-w-0 items-center gap-1.5 text-xs text-muted hover:text-navy"
          >
            <StoreLogo store={store} size={18} />
            <span className="truncate">{store.name}</span>
          </Link>
          {/* The rating is the store's — products are not rated. */}
          <span
            className="ml-auto flex shrink-0 items-center gap-0.5 text-xs font-semibold text-ink"
            aria-label={`${store.name} is rated ${store.rating.toFixed(1)} out of 5`}
          >
            <Star size={12} className="text-star" fill="currentColor" />
            {store.rating.toFixed(1)}
          </span>
        </div>
      )}

      <div className="relative">
        <Link to={`/product/${product.id}`} aria-label={product.name}>
          <ProductImage
            product={product}
            rounded="rounded-card"
            className="aspect-square w-full border border-line"
          />
        </Link>

        {discounted && (
          <span className="absolute left-2 top-2 rounded-md bg-sale px-2 py-1 text-xs font-bold text-white">
            -{product.discountPercent}%
          </span>
        )}

        {action === 'favourite' && (
          <button
            type="button"
            onClick={() => toggleFavourite(product.id)}
            aria-pressed={favourite}
            aria-label={
              favourite ? `Remove ${product.name} from favourites` : `Save ${product.name}`
            }
            title={favourite ? 'Saved' : 'Save for later'}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-colors hover:bg-white"
          >
            <Heart
              size={16}
              className={favourite ? 'text-sale' : 'text-navy-deep'}
              fill={favourite ? 'currentColor' : 'none'}
            />
          </button>
        )}

        <CartStepper product={product} />
      </div>


      <Link
        to={`/product/${product.id}`}
        className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-ink hover:text-navy"
      >
        {product.name}
      </Link>

      <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
        <span className={`text-base font-bold ${discounted ? 'text-sale' : 'text-navy'}`}>
          {formatPrice(price)}
        </span>
        {discounted && (
          <span className="text-sm text-muted line-through">{formatPrice(listPrice)}</span>
        )}
      </div>

      {discounted && (
        <p className="text-sm font-semibold text-sale">{product.discountPercent}% off</p>
      )}
    </article>
  )
}
