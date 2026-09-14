import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { finalPrice, formatPrice, type Product } from '../data'
import { ProductImage } from './ProductImage'

/**
 * The image-led product card used inside a store: photo, a round add button
 * over it that turns into a quantity counter, then name and pricing beneath.
 */
export function StoreProductCard({ product }: { product: Product }) {
  const { cart, addToCart } = useApp()

  const quantity = cart.find((item) => item.productId === product.id)?.quantity ?? 0
  const discounted = (product.discountPercent ?? 0) > 0
  const price = finalPrice(product)

  return (
    <article className="flex flex-col">
      <div className="relative">
        <Link to={`/product/${product.id}`} aria-label={product.name}>
          <ProductImage product={product} rounded="rounded-card" className="aspect-square w-full" />
        </Link>

        <button
          type="button"
          onClick={() => addToCart(product.id)}
          aria-label={
            quantity > 0 ? `Add another ${product.name}, ${quantity} in cart` : `Add ${product.name} to cart`
          }
          className={`absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold shadow-md transition-colors ${
            quantity > 0
              ? 'bg-navy-deep text-white hover:bg-navy'
              : 'border border-line bg-white text-navy-deep hover:bg-navy-tint'
          }`}
        >
          {quantity > 0 ? quantity : <Plus size={20} />}
        </button>
      </div>

      <Link
        to={`/product/${product.id}`}
        className="mt-2.5 line-clamp-2 text-sm font-bold uppercase leading-snug tracking-tight text-ink hover:text-navy"
      >
        {product.name}
      </Link>

      <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
        <span className={`text-base font-bold ${discounted ? 'text-sale' : 'text-navy'}`}>
          {formatPrice(price)}
        </span>
        {discounted && (
          <span className="text-sm text-muted line-through">{formatPrice(product.price)}</span>
        )}
      </div>

      {discounted && (
        <p className="text-sm font-semibold text-sale">{product.discountPercent}% off</p>
      )}
    </article>
  )
}
