import { ChevronLeft, Receipt as ReceiptIcon, Truck } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { TicketReceipt } from '../components/TicketReceipt'
import { useApp } from '../context/AppContext'
import { getStore } from '../data'

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
    <Layout header="none" floatingCart={false} background="tint">
      <ReceiptBar />

      <div className="app-container max-w-sm py-4">
        <TicketReceipt order={order} store={store} />

        <Link to={`/order/${order.id}/tracking`} className="btn-primary mt-5 w-full">
          <Truck size={18} />
          Track order
        </Link>
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
