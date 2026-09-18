import { ArrowLeft } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { DealCard } from '../components/DealCard'
import { stockedCategories, discountedProducts, finalPrice, storeRating, type Category } from '../data'

type SortKey = 'discount' | 'price' | 'rating'

const SORT_LABELS: Record<SortKey, string> = {
  discount: 'Biggest discount',
  price: 'Lowest price',
  rating: 'Top rated store',
}

export default function Discounts() {
  const navigate = useNavigate()
  const [category, setCategory] = useState<Category | 'All'>('All')
  const [sort, setSort] = useState<SortKey>('discount')

  const items = useMemo(() => {
    const filtered = discountedProducts().filter(
      (product) => category === 'All' || product.category === category,
    )

    return [...filtered].sort((a, b) => {
      if (sort === 'discount') return (b.discountPercent ?? 0) - (a.discountPercent ?? 0)
      if (sort === 'price') return finalPrice(a) - finalPrice(b)
      // Ranked by the rating of the store selling it — products are not rated.
      return storeRating(b) - storeRating(a)
    })
  }, [category, sort])

  return (
    <Layout header="none">
      <div className="sticky top-0 z-40 border-b border-line bg-white">
        <div className="app-container flex items-center gap-3 py-3 pr-14">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="-ml-1 rounded-lg p-1.5 text-navy-deep transition-colors hover:bg-navy-tint"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="flex-1 text-base font-semibold text-ink">Discounts</h1>
        </div>

        <div className="app-container no-scrollbar flex gap-2 overflow-x-auto pb-2">
          {(['All', ...stockedCategories] as (Category | 'All')[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setCategory(option)}
              className={`chip ${category === option ? 'chip-active' : ''}`}
              aria-pressed={category === option}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="app-container no-scrollbar flex gap-2 overflow-x-auto pb-2.5">
          {(Object.keys(SORT_LABELS) as SortKey[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSort(option)}
              className={`chip ${sort === option ? 'chip-active' : ''}`}
              aria-pressed={sort === option}
            >
              {SORT_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      <div className="app-container py-4">
        <p className="mb-3 text-xs text-muted">
          {items.length} discounted {items.length === 1 ? 'product' : 'products'}
        </p>

        {items.length === 0 ? (
          <p className="card px-4 py-10 text-center text-sm text-muted">
            No discounts in {category} right now.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {items.map((product) => (
              <DealCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
