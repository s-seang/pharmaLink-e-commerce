import {
  ArrowLeft,
  BadgeCheck,
  Clock,
  FileText,
  MapPin,
  Navigation,
  Phone,
  Stethoscope,
  UserRound,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { StoreChatSheet } from '../components/StoreChatSheet'
import { ProductCard } from '../components/ProductCard'
import { StoreFabs } from '../components/StoreFabs'
import { Layout } from '../components/Layout'
import { OpenBadge } from '../components/OpenBadge'
import { StarRating } from '../components/StarRating'
import { StoreLogo } from '../components/StoreLogo'
import {
  CATEGORIES,
  getStore,
  isOpenNow,
  nextOpening,
  productsByStore,
  type Category,
  type Store,
} from '../data'
import { useApp } from '../context/AppContext'
import { directionsUrl } from '../lib/geo'

/**
 * How a shut pharmacy explains itself. A shop closed off-schedule has no hour
 * to promise, so it says so plainly and quotes the hours it normally keeps
 * rather than claiming a time it cannot meet.
 */
function shutCopy(store: Store, now: Date): { heading: string; hours: string } {
  const opensAt = nextOpening(store, now)
  return opensAt
    ? { heading: `${store.name} is shut until ${opensAt}`, hours: '' }
    : {
        heading: `${store.name} is closed for the day`,
        hours: ` It normally opens ${store.hours.label}.`,
      }
}

export default function StorePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const store = getStore(id)
  const [filter, setFilter] = useState<Category | 'All'>('All')
  const [chatOpen, setChatOpen] = useState(false)
  const [laterOrder, setLaterOrder] = useState(false)
  /** Shown once on arrival; the banner below carries the point from then on. */
  const [closedNotice, setClosedNotice] = useState(true)
  const { now } = useApp()

  const storeProducts = useMemo(() => (store ? productsByStore(store.id) : []), [store])

  const visible = useMemo(
    () =>
      filter === 'All'
        ? storeProducts
        : storeProducts.filter((product) => product.category === filter),
    [storeProducts, filter],
  )

  if (!store) {
    return (
      <Layout>
        <div className="app-container flex flex-col items-center gap-3 py-20 text-center">
          <p className="text-sm font-semibold text-ink">We could not find that pharmacy.</p>
          <Link to="/stores" className="btn-primary">
            All pharmacies
          </Link>
        </div>
      </Layout>
    )
  }

  const { credentials } = store
  const hasAbout =
    store.contactPerson ||
    store.pharmacist ||
    credentials ||
    store.hours ||
    store.address ||
    store.phone ||
    store.description

  const shut = !isOpenNow(store, now)
  const { heading: shutHeading, hours: shutHours } = shutCopy(store, now)

  const countFor = (category: Category | 'All') =>
    category === 'All'
      ? storeProducts.length
      : storeProducts.filter((product) => product.category === category).length

  return (
    <Layout header="none" floatingCart={false} cartBarStore={store.id}>
      <div data-store-band className="bg-navy-deep text-white">
        <div className="app-container py-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="-ml-1 mb-3 rounded-lg p-1.5 text-white/90 transition-colors hover:bg-white/10"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex items-start gap-3">
            <StoreLogo store={store} size={64} className="border-white/30" />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-bold">{store.name}</h1>
              <p className="truncate text-sm text-navy-tint/80">{store.branch}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <StarRating rating={store.rating} reviewCount={store.reviewCount} tone="light" />
                <OpenBadge store={store} tone="light" />
              </div>
            </div>
          </div>

          <a
            href={directionsUrl(store.lat, store.lng, `${store.name} ${store.branch}`)}
            target="_blank"
            rel="noreferrer"
            className="btn mt-4 w-full border border-white/40 text-white hover:bg-white/10 sm:w-auto"
          >
            <Navigation size={16} />
            Directions
          </a>
        </div>
      </div>

      {shut && (
        <div className="app-container pt-4">
          <section className="card flex flex-col gap-3 border-star/40 bg-star/5 p-4 sm:flex-row sm:items-center">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-star/15 text-star">
              <Clock size={18} />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{shutHeading}</p>
              <p className="mt-0.5 text-xs text-muted">
                {laterOrder
                  ? 'Saved for later — add what you need and the pharmacy will prepare it when it opens.'
                  : `Order now and they will prepare it when they open.${shutHours}`}
              </p>
            </div>

            {!laterOrder && (
              <button
                type="button"
                onClick={() => setLaterOrder(true)}
                className="btn-primary shrink-0 sm:w-auto"
              >
                Order for later
              </button>
            )}
          </section>
        </div>
      )}

      <div className="app-container space-y-7 py-5">
        {hasAbout && (
          <section>
            <h2 className="section-title mb-3">About this pharmacy</h2>
            <div className="card divide-y divide-line">
              {store.description && (
                <p className="p-3.5 text-sm leading-relaxed text-ink/90">{store.description}</p>
              )}

              {store.contactPerson && (
                <Detail icon={UserRound} label="Contact person">
                  {store.contactPerson}
                </Detail>
              )}

              {store.pharmacist && (
                <Detail icon={Stethoscope} label="Pharmacist / doctor">
                  {store.pharmacist}
                </Detail>
              )}

              {credentials && (
                <Detail icon={BadgeCheck} label="Credentials">
                  <div className="space-y-1.5">
                    {credentials.licenceNumber && <p>Licence {credentials.licenceNumber}</p>}
                    {credentials.degree && <p>{credentials.degree}</p>}
                    {credentials.documents?.map((doc) => (
                      <a
                        key={doc.url}
                        href={doc.url}
                        className="flex items-center gap-1.5 text-xs font-semibold text-navy hover:underline"
                      >
                        <FileText size={13} />
                        {doc.label}
                      </a>
                    ))}
                  </div>
                </Detail>
              )}

              <Detail icon={Clock} label="Opening hours">
                {store.hours.label}
              </Detail>

              <Detail icon={MapPin} label="Address">
                {store.address}
              </Detail>

              <Detail icon={Phone} label="Phone">
                <a href={`tel:${store.phone.replace(/[^\d+]/g, '')}`} className="hover:underline">
                  {store.phone}
                </a>
              </Detail>
            </div>
          </section>
        )}

        <section>
          <h2 className="section-title mb-3">Products</h2>
          <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
            {(['All', ...CATEGORIES] as (Category | 'All')[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                className={`chip ${filter === option ? 'chip-active' : ''}`}
                aria-pressed={filter === option}
              >
                {option}
                <span className={filter === option ? 'text-white/70' : 'text-muted'}>
                  {countFor(option)}
                </span>
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="card px-4 py-10 text-center text-sm text-muted">
              This pharmacy has no {filter.toLowerCase()} products listed yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-4">
              {visible.map((product) => (
                <ProductCard key={product.id} product={product} action="none" />
              ))}
            </div>
          )}
        </section>
      </div>

      <StoreFabs
        storeName={store.name}
        onText={() => setChatOpen(true)}
        hidden={chatOpen}
      />

      <StoreChatSheet store={store} open={chatOpen} onClose={() => setChatOpen(false)} />

      {shut && closedNotice && (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="shut-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setClosedNotice(false)
          }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h2 id="shut-title" className="text-lg font-bold leading-snug text-ink">
              {shutHeading}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Order now and they will prepare it when they open.
            </p>

            <button
              type="button"
              onClick={() => {
                setClosedNotice(false)
                setLaterOrder(true)
              }}
              className="btn-primary mt-5 w-full"
            >
              Order for later
            </button>

            <Link to="/stores" className="btn-outline mt-2 w-full">
              Find one that is open
            </Link>
          </div>
        </div>
      )}
    </Layout>
  )
}

function Detail({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof UserRound
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-3 p-3.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-tint text-navy">
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted">{label}</p>
        <div className="text-sm text-ink">{children}</div>
      </div>
    </div>
  )
}
