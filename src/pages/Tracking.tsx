import { Check, ChevronLeft, MapPin, Package, Phone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useApp } from '../context/AppContext'
import { getStore } from '../data'
import { deliveryMinutes, distanceKm, formatEta, telHref } from '../lib/geo'

const STEPS = ['Order Confirmed', 'Preparing Your Order', 'Out for Delivery', 'Delivered']

/** "10:24 AM" */
function formatClock(ms: number): string {
  return new Date(ms).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export default function Tracking() {
  const { id } = useParams()
  const { orders, address, coords } = useApp()
  // The stages are read off the clock, so the page has to re-read it to move.
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 15_000)
    return () => window.clearInterval(tick)
  }, [])

  const order = orders.find((candidate) => candidate.id === id)
  const store = order ? getStore(order.storeId) : undefined

  if (!order || !store) {
    return (
      <Layout header="none" floatingCart={false}>
        <TrackingBar />
        <div className="app-container py-16">
          <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
            <Package size={36} className="text-line" />
            <p className="text-sm font-semibold text-ink">There is nothing to track here.</p>
            <Link to="/orders" className="btn-primary mt-1">
              Your previous orders
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  const placedAt = new Date(order.placedOn).getTime()
  const ride = deliveryMinutes(store.prepMinutes, distanceKm(coords, store))
  // Minutes after the order was placed that each step lands.
  const offsets = [0, 2, store.prepMinutes, ride]
  const elapsed = (now - placedAt) / 60000
  const reached = offsets.filter((minutes) => elapsed >= minutes).length
  const delivered = reached === offsets.length
  const onTheWay = reached >= 3

  return (
    <Layout header="none" floatingCart={false}>
      <TrackingBar />

      <div className="app-container max-w-md space-y-3 py-4">
        <section className="card overflow-hidden">
          <div className="px-5 pt-5 text-center">
            <p className="text-sm font-semibold text-ink">
              {delivered
                ? 'Your order has arrived'
                : onTheWay
                  ? 'Your order is on the way!'
                  : 'Your order is being prepared'}
            </p>
            <p className="mt-0.5 text-xs text-muted">From {store.name}</p>

            <p className="mt-3 text-xs text-muted">{delivered ? 'Delivered at' : 'Arriving in'}</p>
            <p className="text-3xl font-bold text-navy">
              {delivered
                ? formatClock(placedAt + ride * 60000)
                : formatEta(Math.max(0, ride - elapsed))}
            </p>
          </div>

          <RiderScene />
        </section>

        <section className="card p-4">
          <ol>
            {STEPS.map((label, index) => {
              const done = delivered || index < reached - 1
              const current = !delivered && index === reached - 1
              return (
                <li key={label} className="relative flex gap-3 pb-5 last:pb-0">
                  {index < STEPS.length - 1 && (
                    <span
                      aria-hidden="true"
                      className={`absolute bottom-0 left-[11px] top-6 w-0.5 ${
                        done ? 'bg-teal' : 'bg-line'
                      }`}
                    />
                  )}

                  <span
                    aria-hidden="true"
                    className={`z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      done
                        ? 'bg-teal text-white'
                        : current
                          ? 'bg-white ring-2 ring-navy'
                          : 'border border-line bg-white'
                    }`}
                  >
                    {done ? (
                      <Check size={14} strokeWidth={3} />
                    ) : (
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          current ? 'animate-pulse bg-navy' : 'bg-line'
                        }`}
                      />
                    )}
                  </span>

                  <span className="flex min-w-0 flex-1 items-start justify-between gap-3">
                    <span
                      className={`text-sm ${
                        current
                          ? 'font-bold text-navy'
                          : done
                            ? 'font-semibold text-ink'
                            : 'text-muted'
                      }`}
                    >
                      {label}
                    </span>
                    <span className="shrink-0 text-xs text-muted">
                      {index < reached ? formatClock(placedAt + offsets[index] * 60000) : 'Upcoming'}
                    </span>
                  </span>
                </li>
              )
            })}
          </ol>
        </section>

        <section className="card flex items-center gap-3 p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-tint text-navy">
            <MapPin size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Delivery address
            </p>
            <p className="truncate text-sm font-semibold text-ink">{address.line1}</p>
            <p className="truncate text-xs text-muted">
              {address.area}, {address.city}
            </p>
          </div>
          <a
            href={telHref(store.phone)}
            aria-label={`Call ${store.name}`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal text-white transition-colors hover:bg-navy"
          >
            <Phone size={18} />
          </a>
        </section>

        <Link to={`/order/${order.id}`} className="btn-outline w-full">
          View receipt
        </Link>
      </div>
    </Layout>
  )
}

function TrackingBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="app-container flex items-center gap-2 py-3">
        <Link
          to="/"
          aria-label="Back to home"
          className="-ml-1.5 rounded-lg p-1.5 text-ink transition-colors hover:bg-surface"
        >
          <ChevronLeft size={22} />
        </Link>
        <h1 className="flex-1 text-center text-base font-bold text-ink">Order Tracking</h1>
        <span className="w-9 shrink-0" aria-hidden="true" />
      </div>
    </header>
  )
}

/** Decorative: a rider carrying the order across town. */
function RiderScene() {
  return (
    <svg viewBox="0 0 320 180" className="mt-2 w-full bg-navy-tint" aria-hidden="true">
      <rect x="10" y="84" width="34" height="68" rx="4" fill="#DDE8F2" />
      <rect x="48" y="104" width="24" height="48" rx="4" fill="#E6EFF7" />
      <rect x="244" y="92" width="32" height="60" rx="4" fill="#DDE8F2" />
      <rect x="280" y="110" width="24" height="42" rx="4" fill="#E6EFF7" />
      <g fill="#FFFFFF" opacity="0.7">
        <rect x="18" y="94" width="8" height="8" rx="2" />
        <rect x="30" y="94" width="8" height="8" rx="2" />
        <rect x="18" y="110" width="8" height="8" rx="2" />
        <rect x="252" y="102" width="8" height="8" rx="2" />
        <rect x="264" y="102" width="8" height="8" rx="2" />
        <rect x="252" y="118" width="8" height="8" rx="2" />
      </g>

      <g stroke="#CBD9E6" strokeWidth="4" strokeLinecap="round">
        <line x1="76" y1="88" x2="94" y2="88" />
        <line x1="68" y1="106" x2="92" y2="106" />
        <line x1="78" y1="124" x2="92" y2="124" />
      </g>

      <line
        x1="8"
        y1="152"
        x2="312"
        y2="152"
        stroke="#CBD9E6"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <rect x="96" y="68" width="44" height="36" rx="8" fill="#2B5C8A" />
      <rect x="113" y="76" width="10" height="20" rx="2" fill="#FFFFFF" />
      <rect x="108" y="81" width="20" height="10" rx="2" fill="#FFFFFF" />

      <rect x="112" y="100" width="54" height="30" rx="12" fill="#4A9A96" />
      <rect x="130" y="126" width="76" height="10" rx="5" fill="#2B5C8A" />
      <rect x="134" y="94" width="36" height="10" rx="5" fill="#1F4466" />

      <line
        x1="198"
        y1="130"
        x2="212"
        y2="92"
        stroke="#2B5C8A"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <line
        x1="206"
        y1="94"
        x2="222"
        y2="88"
        stroke="#1F4466"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="214" cy="102" r="6" fill="#EF9F27" />

      <line
        x1="158"
        y1="112"
        x2="170"
        y2="132"
        stroke="#1F4466"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <rect x="150" y="76" width="28" height="40" rx="13" fill="#2B5C8A" />
      <line
        x1="170"
        y1="92"
        x2="206"
        y2="90"
        stroke="#2B5C8A"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <circle cx="166" cy="62" r="15" fill="#1F4466" />
      <rect x="172" y="56" width="11" height="9" rx="3" fill="#E4F0EF" />

      <g stroke="#1F4466" strokeWidth="5" fill="#FFFFFF">
        <circle cx="116" cy="134" r="15" />
        <circle cx="208" cy="134" r="15" />
      </g>
      <g fill="#1F4466">
        <circle cx="116" cy="134" r="3" />
        <circle cx="208" cy="134" r="3" />
      </g>
    </svg>
  )
}
