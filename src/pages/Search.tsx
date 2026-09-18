import { ArrowLeft, Search as SearchIcon, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FilterChip, FilterSelect, type FilterOption } from '../components/FilterBar'
import { Layout } from '../components/Layout'
import { ProductCard } from '../components/ProductCard'
import { useApp } from '../context/AppContext'
import {
  CATEGORIES,
  stockedCategories,
  finalPrice,
  getStore,
  isOpenNow,
  products,
  searchProducts,
  storeRating,
  type Category,
  type Product,
} from '../data'
import { distanceKm } from '../lib/geo'

type SortKey = 'All' | 'Rating' | 'Price' | 'Nearby'

/** Ratings belong to stores, so the rating sort says whose rating it is. */
const SORT_OPTIONS: FilterOption<SortKey>[] = [
  { value: 'All', label: 'Recommended' },
  { value: 'Rating', label: 'Store rating' },
  { value: 'Price', label: 'Price: low to high' },
  { value: 'Nearby', label: 'Nearest to me' },
]

const CATEGORY_OPTIONS: FilterOption<Category | 'All'>[] = [
  { value: 'All', label: 'All products' },
  ...stockedCategories.map((category) => ({ value: category, label: category })),
]

/** The store rating a product has to clear for the "Ratings 4.0+" chip. */
const GOOD_RATING = 4

function isCategory(value: string | null): value is Category {
  return !!value && (CATEGORIES as string[]).includes(value)
}

export default function SearchPage() {
  const navigate = useNavigate()
  const { coords } = useApp()
  const [params, setParams] = useSearchParams()

  const categoryParam = params.get('category')
  const category = isCategory(categoryParam) ? categoryParam : null
  const query = params.get('q') ?? ''

  const [sort, setSort] = useState<SortKey>('All')
  const [discountedOnly, setDiscountedOnly] = useState(false)
  const [wellRated, setWellRated] = useState(false)
  const [openNow, setOpenNow] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [draft, setDraft] = useState(query)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (expanded) inputRef.current?.focus()
  }, [expanded])

  const updateParams = (next: { q?: string | null; category?: Category | null }) => {
    const merged = new URLSearchParams(params)
    if ('q' in next) {
      if (next.q) merged.set('q', next.q)
      else merged.delete('q')
    }
    if ('category' in next) {
      if (next.category) merged.set('category', next.category)
      else merged.delete('category')
    }
    setParams(merged, { replace: true })
  }

  const results = useMemo(() => {
    const inCategory = category
      ? products.filter((product) => product.category === category)
      : products

    // Word-by-word match, so "bio derma sleeping mask" finds the Bioderma
    // sleeping mask at every store that lists it.
    let filtered = searchProducts(query, inCategory)

    if (discountedOnly) filtered = filtered.filter((p) => (p.discountPercent ?? 0) > 0)
    if (wellRated) filtered = filtered.filter((p) => storeRating(p) >= GOOD_RATING)
    if (openNow) {
      filtered = filtered.filter((p) => {
        const store = getStore(p.storeId)
        return store ? isOpenNow(store) : false
      })
    }

    const storeDistance = (product: Product) => {
      const store = getStore(product.storeId)
      return store ? distanceKm(coords, store) : Number.POSITIVE_INFINITY
    }

    const sorted = [...filtered]
    // Products are not rated — "Rating" ranks by the rating of the store selling them.
    if (sort === 'Rating') sorted.sort((a, b) => storeRating(b) - storeRating(a))
    if (sort === 'Price') sorted.sort((a, b) => finalPrice(a) - finalPrice(b))
    if (sort === 'Nearby') sorted.sort((a, b) => storeDistance(a) - storeDistance(b))
    return sorted
  }, [category, query, sort, coords, discountedOnly, wellRated, openNow])

  const heading = category ?? (query ? `“${query}”` : 'All products')

  const filtersActive =
    sort !== 'All' || category !== null || discountedOnly || wellRated || openNow

  const clearFilters = () => {
    setSort('All')
    setDiscountedOnly(false)
    setWellRated(false)
    setOpenNow(false)
    updateParams({ category: null })
  }

  return (
    <Layout header="none">
      <div className="sticky top-0 z-40 border-b border-line bg-white">
        {/* pr-14 keeps the search pill clear of the floating cart button. */}
        <div className="app-container flex items-center gap-3 py-3 pr-14">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="-ml-1 rounded-lg p-1.5 text-navy-deep transition-colors hover:bg-navy-tint"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-ink">{heading}</h1>

          {/* Compact search pill, top right — expands into a full input on tap. */}
          {expanded ? (
            <form
              className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full border border-navy bg-white px-3 py-1.5"
              onSubmit={(event) => {
                event.preventDefault()
                updateParams({ q: draft.trim() || null })
                setExpanded(false)
              }}
            >
              <SearchIcon size={16} className="shrink-0 text-navy" />
              <input
                ref={inputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onBlur={() => updateParams({ q: draft.trim() || null })}
                placeholder="Search medicine, skincare, supplements"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
                aria-label="Search products"
              />
              <button
                type="button"
                onClick={() => {
                  setDraft('')
                  updateParams({ q: null })
                  setExpanded(false)
                }}
                className="shrink-0 rounded-full p-0.5 text-muted hover:text-ink"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            </form>
          ) : (
            <div className="flex shrink-0 items-center gap-1 rounded-full border border-line bg-surface py-1.5 pl-3 pr-2">
              <button
                type="button"
                onClick={() => {
                  setDraft(query)
                  setExpanded(true)
                }}
                className="flex items-center gap-1.5 text-sm text-ink"
                aria-label="Expand search"
              >
                <SearchIcon size={16} className="text-navy" />
                {query && <span className="max-w-[7rem] truncate">{query}</span>}
              </button>
              {query && (
                <button
                  type="button"
                  onClick={() => updateParams({ q: null })}
                  className="rounded-full p-0.5 text-muted hover:text-ink"
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="app-container no-scrollbar flex gap-2 overflow-x-auto pb-2.5">
          <FilterSelect label="Sort" value={sort} options={SORT_OPTIONS} onChange={setSort} />
          <FilterSelect
            label="Category"
            value={category ?? 'All'}
            options={CATEGORY_OPTIONS}
            onChange={(next) => updateParams({ category: next === 'All' ? null : next })}
          />
          <FilterChip
            label="Discounted"
            active={discountedOnly}
            onClick={() => setDiscountedOnly((on) => !on)}
          />
          <FilterChip
            label={`Ratings ${GOOD_RATING.toFixed(1)}+`}
            active={wellRated}
            onClick={() => setWellRated((on) => !on)}
          />
          <FilterChip label="Open now" active={openNow} onClick={() => setOpenNow((on) => !on)} />
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
      </div>

      <div className="app-container py-4">
        <p className="mb-3 text-xs text-muted">
          {results.length} {results.length === 1 ? 'product' : 'products'}
          {category ? ` in ${category}` : ''}
        </p>

        {results.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
            <SearchIcon size={32} className="text-line" />
            <p className="text-sm font-semibold text-ink">
              {filtersActive ? 'Nothing matched these filters' : 'No products matched that search'}
            </p>
            <p className="max-w-xs text-xs text-muted">
              {filtersActive
                ? 'The filters above may be narrowing this too far — clear them to see everything that matches.'
                : 'Try a different spelling, or browse one of these categories instead.'}
            </p>

            {/* Offer the way out of the filters first: suggesting another
                category is no help when a chip is what emptied the page. */}
            {filtersActive ? (
              <button type="button" onClick={clearFilters} className="btn-primary mt-1">
                Clear all filters
              </button>
            ) : (
              <div className="mt-1 flex flex-wrap justify-center gap-2">
                {stockedCategories.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="chip"
                    onClick={() => updateParams({ category: option, q: null })}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
