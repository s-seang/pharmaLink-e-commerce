import { discountedProducts } from '../data'
import { ProductCard } from './ProductCard'

/**
 * The home page's discount block. A plain grid, not a rail — everything on
 * offer is visible at a glance instead of hiding to the right of the screen.
 * Capped so the home page stays short; "View all discounts" lists the rest.
 */
export function DiscountGrid({ max = 6 }: { max?: number }) {
  const items = discountedProducts().slice(0, max)

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((product) => (
        <div key={product.id} className="card p-3">
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  )
}
