import { Loader2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { BannerCarousel } from '../components/BannerCarousel'
import { DiscountCarousel } from '../components/DiscountCarousel'
import { Layout } from '../components/Layout'
import { SectionHeader } from '../components/SectionHeader'
import { STORE_ROW_HEIGHT, StoreRow } from '../components/StoreRow'
import { useApp } from '../context/AppContext'
import { stores } from '../data'
import { distanceKm } from '../lib/geo'

/** How many pharmacies the "Nearest to you" box shows before it scrolls. */
const VISIBLE_ROWS = 5

export default function Home() {
  const { coords, locationStatus, requestLocation } = useApp()

  useEffect(() => {
    if (locationStatus === 'idle') requestLocation()
  }, [locationStatus, requestLocation])

  const nearest = useMemo(
    () =>
      stores
        .map((store) => ({ store, km: distanceKm(coords, store) }))
        .sort((a, b) => a.km - b.km),
    [coords],
  )

  return (
    <Layout>
      <div className="app-container space-y-10 py-5">
        <section>
          <BannerCarousel />
        </section>

        <section className="rounded-card bg-surface p-4">
          <SectionHeader
            title="Discounts"
            subtitle="Limited-time prices from our pharmacies"
            viewAllTo="/discounts"
            viewAllLabel="View all discounts"
          />
          <DiscountCarousel max={12} />
        </section>

        <section>
          <SectionHeader
            title="Nearest to you"
            subtitle={
              locationStatus === 'granted'
                ? 'Based on your current location'
                : 'Showing pharmacies near central Phnom Penh'
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
            /* A fixed box that shows five pharmacies at a time and scrolls for the rest. */
            <div
              className="overflow-y-auto rounded-card border border-line bg-surface p-2"
              style={{ maxHeight: VISIBLE_ROWS * STORE_ROW_HEIGHT + (VISIBLE_ROWS - 1) * 8 + 16 }}
            >
              <div className="space-y-2">
                {nearest.map(({ store, km }) => (
                  <StoreRow key={store.id} store={store} distanceKm={km} />
                ))}
              </div>
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
      </div>
    </Layout>
  )
}
