import { CheckCircle2, ChevronLeft, Home, Receipt as ReceiptIcon } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { StoreLogo } from '../components/StoreLogo'
import { useApp } from '../context/AppContext'
import { formatPrice, getProduct, getStore } from '../data'
import { unitLabel } from '../lib/packaging'

/** "16 September 2026 at 14:05" */
function formatPlaced(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })} at ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
}

export default function Receipt() {
  const { id } = useParams()
  const { orders } = useApp()

  const order = orders.find((candidate) => candidate.id === id)
  const store = order ? getStore(order.storeId) : undefined

  if (!order || !store) {
    return (
      <Layout header="none" floatingCart={false}>
        <ReceiptBar />
        <div className="app-container py-16">
          <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
            <ReceiptIcon size={36} className="text-line" />
            <p className="text-sm font-semibold text-ink">We could not find that receipt.</p>
            <Link to="/orders" className="btn-primary mt-1">
              Your previous orders
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout header="none" floatingCart={false}>
      <ReceiptBar />

      <div className="app-container space-y-3 py-5">
        <section className="card flex flex-col items-center gap-2 p-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-tint text-teal">
            <CheckCircle2 size={30} />
          </span>
          <h2 className="text-lg font-bold text-ink">Order placed successfully</h2>
          <p className="max-w-xs text-sm text-muted">
            {store.name} has your order and will start preparing it.
          </p>
        </section>

        <section className="card p-4">
          <div className="flex items-center gap-3 border-b border-line pb-3">
            <StoreLogo store={store} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{store.name}</p>
              <p className="truncate text-xs text-muted">{store.branch}</p>
            </div>
          </div>

          <dl className="space-y-1.5 py-3 text-xs">
            <Meta label="Order" value={order.id} />
            <Meta label="Placed" value={formatPlaced(order.placedOn)} />
            {order.payment && <Meta label="Paid with" value={order.payment} />}
          </dl>

          <ul className="divide-y divide-line border-t border-line">
            {order.lines.map((line) => {
              const product = getProduct(line.productId)
              return (
                <li key={line.lineId} className="flex gap-3 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink">
                      {product?.name ?? 'Product'}
                    </span>
                    <span className="block text-xs text-muted">
                      {line.quantity} × {line.units}{' '}
                      {product ? unitLabel(product.unit, line.units) : 'units'}
                    </span>
                    {line.note && (
                      <span className="block text-xs italic text-teal">“{line.note}”</span>
                    )}
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-ink">
                    {formatPrice(line.price * line.quantity)}
                  </span>
                </li>
              )
            })}
          </ul>

          <div className="flex items-center justify-between border-t border-line pt-3">
            <span className="text-base font-bold text-ink">Total paid</span>
            <span className="text-base font-bold text-ink">{formatPrice(order.total)}</span>
          </div>
        </section>

        <div className="flex gap-3">
          <Link to="/" className="btn-outline flex-1">
            <Home size={18} />
            Home
          </Link>
          <Link to="/orders" className="btn-primary flex-1">
            Your orders
          </Link>
        </div>
      </div>
    </Layout>
  )
}

function ReceiptBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="app-container flex items-center gap-2 py-3">
        <Link
          to="/orders"
          aria-label="Back to your orders"
          className="-ml-1.5 rounded-lg p-1.5 text-ink transition-colors hover:bg-surface"
        >
          <ChevronLeft size={22} />
        </Link>
        <h1 className="flex-1 text-center text-base font-bold text-ink">Receipt</h1>
        <span className="w-9 shrink-0" aria-hidden="true" />
      </div>
    </header>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="truncate font-medium text-ink">{value}</dd>
    </div>
  )
}
