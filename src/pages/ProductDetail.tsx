import { ArrowLeft, Heart, MapPin, Phone, ShoppingCart } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { ProductCard } from '../components/ProductCard'
import { ProductImage } from '../components/ProductImage'
import { ProductOptions } from '../components/ProductOptions'
import { StarRating } from '../components/StarRating'
import { StoreLogo } from '../components/StoreLogo'
import { useApp } from '../context/AppContext'
import { useAboveFooter } from '../hooks/useAboveFooter'
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
  const { openCart, cartCount, toggleFavourite, isFavourite, coords } = useApp()
  const clearOfFooter = useAboveFooter()

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
  const discounted = (product.discountPercent ?? 0) > 0
  const favourite = isFavourite(product.id)
  const moreFromStore = productsByStore(product.storeId).filter((p) => p.id !== product.id)
  const alsoAt = otherStoresFor(product)
  const similar = similarProducts(product)

  return (
    <Layout header="none">
      <div className="relative">
        <ProductImage
          product={product}
          rounded="rounded-none"
          className="aspect-square w-full sm:aspect-[16/9]"
        />

        {discounted && (
          <span className="absolute bottom-4 left-4 rounded-md bg-sale px-2.5 py-1 text-sm font-bold text-white">
            -{product.discountPercent}%
          </span>
        )}
      </div>

      {/* Pinned rather than riding the artwork: the way back should not scroll
          off the top of a long product page. Laid out in the content column so
          they stay beside it on a wide screen, and clear of the cart button
          that is fixed in its own strip at the same height. */}
      <div
        className={`pointer-events-none fixed inset-x-0 top-3 z-50 transition-opacity duration-200 ${
          clearOfFooter ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="app-container flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="pointer-events-auto rounded-full bg-white/90 p-2 text-navy-deep shadow-sm backdrop-blur transition-colors hover:bg-white"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>

          <button
            type="button"
            onClick={() => toggleFavourite(product.id)}
            aria-pressed={favourite}
            aria-label={favourite ? 'Remove from favourites' : 'Add to favourites'}
            className="pointer-events-auto mr-12 rounded-full bg-white/90 p-2 shadow-sm backdrop-blur transition-colors hover:bg-white"
          >
            <Heart
              size={20}
              className={favourite ? 'text-sale' : 'text-navy-deep'}
              fill={favourite ? 'currentColor' : 'none'}
            />
          </button>
        </div>
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

        <section>
          <ProductOptions product={product} />
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

      {/* The add control lives in the options above, where the price is; this
          bar is only the two things that are always available. */}
      <div className="sticky bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur">
        <div className="app-container flex items-center gap-3 py-3">
          <button type="button" onClick={openCart} className="btn-outline flex-1">
            <ShoppingCart size={18} />
            View cart{cartCount > 0 ? ` (${cartCount})` : ''}
          </button>
          {store && (
            <a href={telHref(store.phone)} className="btn-teal-outline flex-1">
              <Phone size={18} />
              Consult
            </a>
          )}
        </div>
      </div>

    </Layout>
  )
}
