import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { BannerCarousel } from '../components/BannerCarousel'
import { DiscountGrid } from '../components/DiscountGrid'
import { OfferRail } from '../components/OfferRail'
import { FilterSelect, type FilterOption } from '../components/FilterBar'
import { Layout } from '../components/Layout'
import { OrderAgainRow } from '../components/OrderAgainRow'
import { SectionHeader } from '../components/SectionHeader'
import { StoreRow } from '../components/StoreRow'
import { useApp } from '../context/AppContext'
import {
  bestDiscount,
  leadingCategory,
  openFirst,
  orderedStores,
  stocksCategory,
  stores,
  type Store,
} from '../data'
import { deliveryMinutes, distanceKm } from '../lib/geo'

type SortKey = 'fast' | 'distance' | 'rating' | 'popular'
type OfferKey = 'any' | 'free-delivery' | 'voucher'
type ShopKey =
  | 'All'
  | 'Skincare Store'
  | 'Medicine'
  | 'Supplement'
  | 'Cosmetic'
  | 'Pharmacy'
  | 'Medical Equipment'

const SORT_OPTIONS: FilterOption<SortKey>[] = [
  { value: 'fast', label: 'Fast delivery' },
  { value: 'distance', label: 'Distance' },
  { value: 'rating', label: 'Rating (high to low)' },
  { value: 'popular', label: 'Most purchased' },
]

const OFFER_OPTIONS: FilterOption<OfferKey>[] = [
  { value: 'any', label: 'Any offer' },
  { value: 'free-delivery', label: 'Free delivery' },
  { value: 'voucher', label: 'Voucher' },
]

const SHOP_OPTIONS: FilterOption<ShopKey>[] = [
  { value: 'All', label: 'All pharmacies' },
  { value: 'Skincare Store', label: 'Skincare Store' },
  { value: 'Medicine', label: 'Medicine' },
  { value: 'Supplement', label: 'Supplement' },
  { value: 'Cosmetic', label: 'Cosmetic' },
  { value: 'Pharmacy', label: 'Pharmacy' },
  { value: 'Medical Equipment', label: 'Medical Equipment' },
]

/**
 * Two of these read the shop's type, the rest read what it actually stocks.
 * "Skincare Store" is the narrower of the two cosmetics filters: a shop whose
 * biggest shelf is cosmetics, rather than any shop that happens to carry some.
 */
function matchesShopFilter(store: Store, filter: ShopKey): boolean {
  switch (filter) {
    case 'All':
      return true
    case 'Pharmacy':
    case 'Medicine':
      return store.type === filter
    case 'Skincare Store':
      return leadingCategory(store) === 'Cosmetic'
    default:
      return stocksCategory(store, filter)
  }
}

/**
 * The two offers a shop can be running: delivery on the house, or money off
 * the products themselves.
 */
function matchesOffer(store: Store, offer: OfferKey): boolean {
  if (offer === 'free-delivery') return store.freeDelivery === true
  if (offer === 'voucher') return bestDiscount(store.id) > 0
  return true
}

export default function Home() {
  const { coords, locationStatus, requestLocation, orders, now } = useApp()

  const [sort, setSort] = useState<SortKey>('fast')
  const [offer, setOffer] = useState<OfferKey>('any')
  const [shop, setShop] = useState<ShopKey>('All')

  useEffect(() => {
    if (locationStatus === 'idle') requestLocation()
  }, [locationStatus, requestLocation])

  const withDistance = useMemo(
    () => stores.map((store) => ({ store, km: distanceKm(coords, store) })),
    [coords],
  )

  /**
   * Somewhere that can take the order right now, closest first. A shut
   * pharmacy 200m away is no use, so open ones lead and the closed ones keep
   * their distance order behind them.
   */
  const nearest = useMemo(
    () =>
      [...withDistance].sort(
        (a, b) => openFirst(a.store, b.store, now) || a.km - b.km,
      ),
    [withDistance, now],
  )

  const ordered = useMemo(() => {
    const km = new Map(withDistance.map(({ store, km }) => [store.id, km]))
    return orderedStores(orders)
      .map(({ store }) => ({ store, km: km.get(store.id) ?? 0 }))
      .sort((a, b) => openFirst(a.store, b.store, now))
  }, [withDistance, orders, now])

  /** The browse list, which is what the filter row below it drives. */
  const browse = useMemo(() => {
    const filtered = withDistance.filter(
      ({ store }) =>
        matchesShopFilter(store, shop) && matchesOffer(store, offer),
    )

    return filtered.sort((a, b) => {
      const open = openFirst(a.store, b.store, now)
      if (open !== 0) return open
      if (sort === 'distance') return a.km - b.km
      if (sort === 'rating') return b.store.rating - a.store.rating
      // No order counts without a backend, so reviews stand in for how busy a shop is.
      if (sort === 'popular') return b.store.reviewCount - a.store.reviewCount
      return (
        deliveryMinutes(a.store.prepMinutes, a.km) - deliveryMinutes(b.store.prepMinutes, b.km)
      )
    })
  }, [withDistance, shop, offer, sort, now])

  const filtersActive = sort !== 'fast' || offer !== 'any' || shop !== 'All'

  const clearFilters = () => {
    setSort('fast')
    setOffer('any')
    setShop('All')
  }

  return (
    <Layout>
      <div className="app-container space-y-10 py-5">
        <section>
          <BannerCarousel />
        </section>

        <OfferRail />

        <section className="rounded-card bg-surface p-4">
          <SectionHeader
            title="Discounts"
            subtitle="Limited-time prices from our pharmacies"
            viewAllTo="/discounts"
            viewAllLabel="View all discounts"
          />
          <DiscountGrid max={6} />
        </section>

        {ordered.length > 0 && (
          <section>
            <SectionHeader
              title="Order again"
              subtitle="Pharmacies you have ordered from before"
              viewAllTo="/orders"
              viewAllLabel="View all past orders"
            />
            <div className="space-y-7">
              {ordered.map(({ store, km }) => (
                <OrderAgainRow key={store.id} store={store} km={km} />
              ))}
            </div>
          </section>
        )}

        <section>
          <SectionHeader
            title="Nearest to you"
            subtitle={
              locationStatus === 'granted'
                ? 'Open now first, then closest to you'
                : 'Near central Phnom Penh — open pharmacies first'
            }
            viewAllTo="/stores"
            viewAllLabel="View all pharmacies"
          />

          {locationStatus === 'locating' ? (
            <p className="flex items-center gap-2 py-6 text-sm text-muted">
              <Loader2 size={16} className="animate-spin" />
              Finding pharmacies near you…
            </p>
          ) : (
            /* The same rows as the browse list below, laid out sideways —
               closest first, the rest a swipe away. */
            <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
              {nearest.map(({ store, km }) => (
                <StoreRow
                  key={store.id}
                  store={store}
                  distanceKm={km}
                  className="w-72 shrink-0"
                />
              ))}
            </div>
          )}

          {locationStatus === 'fallback' && (
            <button
              type="button"
              onClick={requestLocation}
              className="mt-3 text-xs font-semibold text-navy hover:underline"
            >
              Use my location instead
            </button>
          )}
        </section>

        {/* Separate from the box above: that one answers "what is closest",
            this one lets the shopper decide what "best" means. */}
        <section>
          <SectionHeader
            title="Explore shops"
            subtitle="Sort and filter every pharmacy we deliver from"
            viewAllTo="/stores"
            viewAllLabel="View all pharmacies"
          />

          <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
            <FilterSelect label="Sort" value={sort} options={SORT_OPTIONS} onChange={setSort} />
            <FilterSelect label="Offers" value={offer} options={OFFER_OPTIONS} onChange={setOffer} />
            <FilterSelect label="Category" value={shop} options={SHOP_OPTIONS} onChange={setShop} />
            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="chip shrink-0 border-transparent text-muted hover:text-sale"
              >
                Clear all
              </button>
            )}
          </div>

          {browse.length === 0 ? (
            <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center">
              <p className="text-sm font-semibold text-ink">No pharmacies match these filters</p>
              <button type="button" onClick={clearFilters} className="btn-primary">
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {browse.map(({ store, km }) => (
                <StoreRow key={store.id} store={store} distanceKm={km} />
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  )
}
