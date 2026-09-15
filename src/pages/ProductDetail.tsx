import { ArrowLeft, Heart, MapPin, Minus, Phone, Plus, ShoppingCart } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { ProductCard } from '../components/ProductCard'
import { ProductImage } from '../components/ProductImage'
import { StarRating } from '../components/StarRating'
import { StoreLogo } from '../components/StoreLogo'
import { useApp } from '../context/AppContext'
import {
  finalPrice,
  formatPrice,
  getProduct,
  getStore,
  otherStoresFor,
  productsByStore,
  similarProducts,
} from '../data'
import { distanceKm, formatDistance, telHref } from '../lib/geo'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart, setQuantity, openCart, cart, toggleFavourite, isFavourite, coords } = useApp()

  const product = getProduct(id)

  if (!product) {
    return (
      <Layout>
        <div className="app-container flex flex-col items-center gap-3 py-20 text-center">
          <p className="text-sm font-semibold text-ink">We could not find that product.</p>
          <Link to="/search" className="btn-primary">
            Browse products
          </Link>
        </div>
      </Layout>
    )
  }

  const store = getStore(product.storeId)
  const inCart = cart.find((item) => item.productId === product.id)?.quantity ?? 0
  const discounted = (product.discountPercent ?? 0) > 0
  const favourite = isFavourite(product.id)
  const moreFromStore = productsByStore(product.storeId).filter((p) => p.id !== product.id)
  const alsoAt = otherStoresFor(product)
  const similar = similarProducts(product)

  return (
    <Layout header="none" cartBar={false}>
      <div className="relative">
        <ProductImage
          product={product}
          rounded="rounded-none"
          className="aspect-square w-full sm:aspect-[16/9]"
        />

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute left-4 top-3 rounded-full bg-white/90 p-2 text-navy-deep shadow-sm backdrop-blur transition-colors hover:bg-white"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Clear of the floating cart button, which is fixed at right-4. */}
        <button
          type="button"
          onClick={() => toggleFavourite(product.id)}
          aria-pressed={favourite}
          aria-label={favourite ? 'Remove from favourites' : 'Add to favourites'}
          className="absolute right-[4.25rem] top-3 rounded-full bg-white/90 p-2 shadow-sm backdrop-blur transition-colors hover:bg-white"
        >
          <Heart
            size={20}
            className={favourite ? 'text-sale' : 'text-navy-deep'}
            fill={favourite ? 'currentColor' : 'none'}
          />
        </button>

        {discounted && (
          <span className="absolute bottom-4 left-4 rounded-md bg-sale px-2.5 py-1 text-sm font-bold text-white">
            -{product.discountPercent}%
          </span>
        )}
      </div>

      <div className="app-container space-y-6 py-5 pb-28">
        <section className="space-y-2">
          <span className="inline-block rounded-full bg-navy-tint px-2.5 py-1 text-xs font-medium text-navy">
            {product.category}
          </span>
          <h1 className="text-xl font-bold leading-snug text-ink">{product.name}</h1>

          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold text-navy">
              {formatPrice(finalPrice(product))}
            </span>
            {discounted && (
              <span className="text-sm text-muted line-through">{formatPrice(product.price)}</span>
            )}
          </div>
        </section>

        <section>
          <h2 className="section-title mb-1.5">Description</h2>
          <p className="text-sm leading-relaxed text-ink/90">{product.description}</p>
        </section>

        {store && (
          <section>
            <h2 className="section-title mb-2">Sold by</h2>
            <Link
              to={`/store/${store.id}`}
              className="card flex items-center gap-3 p-3 transition-colors hover:border-navy"
            >
              <StoreLogo store={store} size={52} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{store.name}</p>
                <StarRating
                  rating={store.rating}
                  showCount={false}
                  size={15}
                  className="mt-0.5"
                />
                <span className="ml-1 text-xs text-muted">
                  {store.rating.toFixed(1)} · {store.reviewCount} store reviews
                </span>
                <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted">
                  <MapPin size={12} className="shrink-0 text-navy" />
                  {formatDistance(distanceKm(coords, store))} · {store.branch}
                </p>
              </div>
            </Link>
          </section>
        )}

        {alsoAt.length > 0 && (
          <section>
            <h2 className="section-title mb-3">Also at these stores</h2>
            <div className="space-y-2.5">
              {alsoAt.map((listing) => {
                const seller = getStore(listing.storeId)
                if (!seller) return null
                return (
                  <Link
                    key={listing.id}
                    to={`/product/${listing.id}`}
                    className="card flex items-center gap-3 p-3 transition-colors hover:border-navy"
                  >
                    <StoreLogo store={seller} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{seller.name}</p>
                      <StarRating rating={seller.rating} reviewCount={seller.reviewCount} />
                    </div>
                    <span className="shrink-0 text-sm font-bold text-navy">
                      {formatPrice(finalPrice(listing))}
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {moreFromStore.length > 0 && (
          <section>
            <h2 className="section-title mb-3">More from this store</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
              {moreFromStore.slice(0, 4).map((item) => (
                <ProductCard key={item.id} product={item} showStore={false} />
              ))}
            </div>
          </section>
        )}

        {similar.length > 0 && (
          <section>
            <h2 className="section-title mb-3">Similar products</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
              {similar.slice(0, 4).map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Add to cart and Consult, pinned above the fold on mobile. Once the
          product is in the cart the button becomes a stepper plus a way through
          to the cart — this page hides the app's cart bar, so the confirmation
          that the add landed has to come from here. */}
      <div className="sticky bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur">
        <div className="app-container flex items-center gap-3 py-3">
          {inCart > 0 ? (
            <>
              <div className="flex shrink-0 items-center rounded-lg border border-line bg-white">
                <button
                  type="button"
                  className="p-2.5 text-muted hover:text-navy"
                  onClick={() => setQuantity(product.id, inCart - 1)}
                  aria-label={`Decrease quantity of ${product.name}`}
                >
                  <Minus size={16} />
                </button>
                <span className="min-w-6 text-center text-sm font-bold text-ink">{inCart}</span>
                <button
                  type="button"
                  className="p-2.5 text-muted hover:text-navy"
                  onClick={() => addToCart(product.id)}
                  aria-label={`Increase quantity of ${product.name}`}
                >
                  <Plus size={16} />
                </button>
              </div>
              <button type="button" onClick={openCart} className="btn-primary flex-1">
                <ShoppingCart size={18} />
                View cart
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => addToCart(product.id)}
              className="btn-primary flex-1"
            >
              <ShoppingCart size={18} />
              Add to cart
            </button>
          )}

          {store && (
            <a
              href={telHref(store.phone)}
              className={`btn-teal-outline ${inCart > 0 ? 'shrink-0 px-3' : 'flex-1'}`}
              aria-label={`Consult ${store.name}`}
            >
              <Phone size={18} />
              {inCart === 0 && 'Consult'}
            </a>
          )}
        </div>
      </div>
    </Layout>
  )
}
