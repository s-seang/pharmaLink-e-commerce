import { Bike } from 'lucide-react'
import { Link } from 'react-router-dom'
import { finalPrice, formatPrice, topPicks, type Store } from '../data'
import { deliveryMinutes, formatEta } from '../lib/geo'
import { CartStepper } from './CartStepper'
import { OpenBadge } from './OpenBadge'
import { ProductImage } from './ProductImage'
import { StoreLogo } from './StoreLogo'

/**
 * One shop the shopper has ordered from before: its header, then a sideways
 * rail of what is worth looking at there now.
 *
 * Deliberately not the items they bought last time. Someone coming back to a
 * pharmacy is coming back to the shop, not to repeat a box of paracetamol, so
 * `topPicks` leads with whatever is on offer.
 */
export function OrderAgainRow({ store, km }: { store: Store; km: number }) {
  const picks = topPicks(store.id, 8)
  if (picks.length === 0) return null

  return (
    <section>
      <div className="flex items-center gap-3">
        <Link to={`/store/${store.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          <StoreLogo store={store} size={48} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink">{store.name}</p>
            <p className="flex items-center gap-1.5 truncate text-xs text-muted">
              <Bike size={13} className="shrink-0 text-navy" />
              {formatEta(deliveryMinutes(store.prepMinutes, km))} · {store.branch}
            </p>
            <OpenBadge store={store} className="mt-0.5" />
            {store.freeDelivery && (
              <span className="mt-1 inline-flex rounded-full bg-teal-tint px-2 py-0.5 text-[11px] font-bold text-teal">
                Free delivery voucher
              </span>
            )}
          </div>
        </Link>
      </div>

      <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-1">
        {picks.map((product) => {
          const discounted = (product.discountPercent ?? 0) > 0
          return (
            <article key={product.id} className="w-36 shrink-0">
              <div className="relative">
                <Link to={`/product/${product.id}`} aria-label={product.name}>
                  <ProductImage
                    product={product}
                    rounded="rounded-card"
                    className="aspect-square w-full border border-line"
                  />
                </Link>
                <CartStepper product={product} />
              </div>

              <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5">
                <span className={`text-base font-bold ${discounted ? 'text-sale' : 'text-navy'}`}>
                  {formatPrice(finalPrice(product))}
                </span>
                {discounted && (
                  <span className="text-xs text-muted line-through">
                    {formatPrice(product.price)}
                  </span>
                )}
              </p>

              <Link
                to={`/product/${product.id}`}
                className="line-clamp-2 text-xs leading-snug text-ink hover:text-navy"
              >
                {product.name}
              </Link>
            </article>
          )
        })}
      </div>
    </section>
  )
}
