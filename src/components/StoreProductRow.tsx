import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CartStepper } from './CartStepper'
import { ProductImage } from './ProductImage'
import { useApp } from '../context/AppContext'
import { finalPrice, formatPrice, type Product } from '../data'
import { unitLabel } from '../lib/packaging'

/**
 * One product on a pharmacy's own shelf, laid out as a row.
 *
 * Inside a shop the question is what to buy rather than where from, so the
 * space a grid spends on the pharmacy's name goes to the product's own
 * description instead — and the rows scan far faster than tiles.
 */
export function StoreProductRow({ product }: { product: Product }) {
  const { toggleFavourite, isFavourite } = useApp()
  const discounted = (product.discountPercent ?? 0) > 0
  const favourite = isFavourite(product.id)

  return (
    <article className="flex gap-3 py-3.5">
      <Link to={`/product/${product.id}`} aria-label={product.name} className="shrink-0">
        <ProductImage
          product={product}
          rounded="rounded-xl"
          className="h-24 w-24 border border-line"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start gap-2">
          <Link
            to={`/product/${product.id}`}
            className="line-clamp-2 flex-1 text-sm font-bold leading-snug text-ink hover:text-navy"
          >
            {product.name}
          </Link>

          <button
            type="button"
            onClick={() => toggleFavourite(product.id)}
            aria-pressed={favourite}
            aria-label={favourite ? `Remove ${product.name} from favourites` : `Save ${product.name}`}
            className="-mr-1 -mt-1 shrink-0 rounded-lg p-1 text-navy-deep transition-colors hover:text-sale"
          >
            <Heart size={16} className={favourite ? 'text-sale' : ''} fill={favourite ? 'currentColor' : 'none'} />
          </button>
        </div>

        <p className="mt-0.5 line-clamp-1 text-xs text-muted">{product.summary}</p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div className="min-w-0">
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span className={`text-base font-bold ${discounted ? 'text-sale' : 'text-navy'}`}>
                {formatPrice(finalPrice(product))}
              </span>
              {discounted && (
                <span className="text-xs text-muted line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </p>
            <p className="text-[11px] text-muted">
              {product.packSize} {unitLabel(product.unit, product.packSize)} per pack
            </p>
          </div>

          {/* The stepper anchors to the bottom right of its own box. */}
          <div className="relative h-11 w-32 shrink-0">
            <CartStepper product={product} />
          </div>
        </div>
      </div>
    </article>
  )
}
