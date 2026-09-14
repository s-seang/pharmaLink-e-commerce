import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { discountedProducts, finalPrice, formatPrice, getStore } from '../data'
import { ProductImage } from './ProductImage'
import { StarRating } from './StarRating'

/**
 * Discount rail. It does not move on its own — the user scrolls it.
 * Capped so the home page stays light no matter how many products go on sale;
 * cards link to /discounts, which lists them all.
 */
export function DiscountCarousel({ max = 12 }: { max?: number }) {
  const railRef = useRef<HTMLDivElement>(null)
  const items = discountedProducts().slice(0, max)

  return (
    <div ref={railRef} className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
      {items.map((product) => {
        const store = getStore(product.storeId)
        return (
          <Link
            key={product.id}
            to="/discounts"
            className="card w-40 shrink-0 overflow-hidden transition-colors hover:border-navy"
          >
            <div className="relative">
              <ProductImage product={product} className="aspect-square w-full" />
              <span className="absolute left-2 top-2 rounded-md bg-sale px-1.5 py-0.5 text-[11px] font-bold text-white">
                -{product.discountPercent}%
              </span>
            </div>
            <div className="space-y-1 p-2.5">
              <p className="line-clamp-2 text-xs font-semibold leading-snug text-ink">
                {product.name}
              </p>
              <p className="truncate text-[11px] text-teal">{store?.name}</p>
              {store && (
                <StarRating rating={store.rating} reviewCount={store.reviewCount} size={11} />
              )}
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold text-navy">
                  {formatPrice(finalPrice(product))}
                </span>
                <span className="text-[11px] text-muted line-through">
                  {formatPrice(product.price)}
                </span>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
