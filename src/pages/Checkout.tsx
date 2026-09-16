import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  MapPin,
  Pencil,
  ShoppingCart,
  Smartphone,
  Ticket,
  Truck,
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AbaPayment } from '../components/AbaPayment'
import { OptionSheet } from '../components/FilterBar'
import { Layout } from '../components/Layout'
import { OrderPlaced } from '../components/OrderPlaced'
import { useApp } from '../context/AppContext'
import { formatPrice, getProduct, type Order, type Store } from '../data'
import {
  DELIVERY_CHOICES,
  FREE_DELIVERY_OVER,
  deliveryChoice,
  voucherValue,
  type DeliveryAddress,
  type DeliveryKey,
} from '../lib/delivery'
import { deliveryMinutes, distanceKm, formatEta } from '../lib/geo'
import { itemListPrice } from '../lib/packaging'

type PaymentKey = 'cash' | 'aba' | 'card'

const PAYMENTS: { value: PaymentKey; label: string; note: string; icon: typeof Banknote }[] = [
  { value: 'cash', label: 'Cash on delivery', note: 'Pay the rider when it arrives', icon: Banknote },
  { value: 'aba', label: 'ABA Pay', note: 'Confirm in the ABA app', icon: Smartphone },
  { value: 'card', label: 'Card', note: 'Visa or Mastercard', icon: CreditCard },
]

export default function Checkout() {
  const { cart, cartTotal, cartStore, placeOrder, address, setAddress, coords } = useApp()
  const navigate = useNavigate()

  const [speed, setSpeed] = useState<DeliveryKey>('standard')
  const [payment, setPayment] = useState<PaymentKey>('cash')
  const [speedSheet, setSpeedSheet] = useState(false)
  const [editing, setEditing] = useState(false)
  // Minted once when the sheet opens, not per render: the reference is printed
  // in the QR, and a value that changed on re-render would redraw the code the
  // shopper is part-way through scanning.
  const [abaReference, setAbaReference] = useState<string | null>(null)
  // Placing the order empties the cart, so the receipt keeps its own copy of
  // what was bought rather than reading a cart that is already gone.
  const [placed, setPlaced] = useState<{ order: Order; store: Store; reference: string } | null>(
    null,
  )

  // The receipt hands over to tracking, so the shopper watches the order being
  // put together instead of landing back on an empty checkout.
  const leaveReceipt = useCallback(() => {
    if (placed) navigate(`/order/${placed.order.id}/tracking`, { replace: true })
  }, [navigate, placed])

  if (placed) {
    return (
      <OrderPlaced
        order={placed.order}
        store={placed.store}
        reference={placed.reference}
        onDone={leaveReceipt}
      />
    )
  }

  const lines = cart
    .map((item) => ({ item, product: getProduct(item.productId) }))
    .filter((line): line is { item: typeof line.item; product: NonNullable<typeof line.product> } =>
      Boolean(line.product),
    )

  if (lines.length === 0 || !cartStore) {
    return (
      <Layout header="none" floatingCart={false}>
        <CheckoutBar />
        <div className="app-container py-16">
          <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
            <ShoppingCart size={36} className="text-line" />
            <p className="text-sm font-semibold text-ink">There is nothing to check out</p>
            <Link to="/search" className="btn-primary mt-1">
              Browse products
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  const choice = deliveryChoice(speed)
  const subtotal = lines.reduce(
    (sum, { item, product }) => sum + itemListPrice(product, item.units) * item.quantity,
    0,
  )
  const discount = subtotal - cartTotal
  const voucher = voucherValue({
    fee: choice.fee,
    cartTotal,
    storeFreeDelivery: cartStore.freeDelivery,
  })
  const total = cartTotal + choice.fee - voucher

  const label = PAYMENTS.find((option) => option.value === payment)?.label ?? 'Cash on delivery'

  const confirm = () => {
    const order = placeOrder(total, label)
    if (order) navigate(`/order/${order.id}`)
  }

  const baseMinutes = deliveryMinutes(cartStore.prepMinutes, distanceKm(coords, cartStore))
  const eta = formatEta(Math.max(10, baseMinutes - choice.minutesSaved))

  return (
    <Layout header="none" floatingCart={false}>
      <CheckoutBar />

      <div className="app-container space-y-3 py-4">
        <section className="card p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
              <MapPin size={17} className="text-sale" />
              Delivery address
            </h2>
            <button
              type="button"
              onClick={() => setEditing((on) => !on)}
              className="flex items-center gap-1 text-xs font-semibold text-navy hover:underline"
            >
              <Pencil size={13} />
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {editing ? (
            <AddressForm
              address={address}
              onSave={(next) => {
                setAddress(next)
                setEditing(false)
              }}
            />
          ) : (
            <div className="mt-3 text-sm leading-relaxed text-ink">
              <p className="font-semibold">
                {address.label} ({address.phone})
              </p>
              <p className="text-muted">{address.line1}</p>
              <p className="text-muted">{address.area}</p>
              <p className="text-muted">{address.city}</p>
            </div>
          )}
        </section>

        <button
          type="button"
          onClick={() => setSpeedSheet(true)}
          className="card flex w-full items-center gap-3 p-4 text-left transition-colors hover:border-navy"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-tint text-navy">
            <Truck size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-ink">{choice.label}</span>
            <span className="block truncate text-xs text-muted">
              {eta} · {formatPrice(choice.fee)}
            </span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-muted" />
        </button>

        <div className="card flex items-center gap-3 p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-tint text-teal">
            <Ticket size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">
              {voucher > 0
                ? `Free delivery voucher — ${formatPrice(voucher)} off`
                : 'Free delivery voucher'}
            </p>
            <p className="truncate text-xs text-muted">
              {voucher > 0
                ? cartStore.freeDelivery
                  ? `${cartStore.name} is running it`
                  : `Earned by spending over ${formatPrice(FREE_DELIVERY_OVER)}`
                : `Spend ${formatPrice(FREE_DELIVERY_OVER - cartTotal)} more to earn it`}
            </p>
          </div>
        </div>

        <section className="card p-4">
          <h2 className="mb-1 text-sm font-bold text-ink">Payment method</h2>
          <ul className="divide-y divide-line">
            {PAYMENTS.map(({ value, label, note, icon: Icon }) => {
              const chosen = payment === value
              return (
                <li key={value}>
                  <button
                    type="button"
                    onClick={() => setPayment(value)}
                    aria-pressed={chosen}
                    className="flex w-full items-center gap-3 py-3 text-left"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-navy">
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-ink">{label}</span>
                      <span className="block truncate text-xs text-muted">{note}</span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        chosen ? 'border-navy' : 'border-line'
                      }`}
                    >
                      {chosen && <span className="h-2.5 w-2.5 rounded-full bg-navy" />}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="card p-4">
          <h2 className="mb-3 text-sm font-bold text-ink">
            {cartStore.name} · {lines.length} {lines.length === 1 ? 'item' : 'items'}
          </h2>
          <dl className="space-y-2 text-sm">
            <Row label="Subtotal" value={formatPrice(subtotal)} />
            {discount > 0 && (
              <Row label="Product discounts" value={`−${formatPrice(discount)}`} tone="sale" />
            )}
            <Row label="Delivery" value={formatPrice(choice.fee)} />
            {voucher > 0 && (
              <Row label="Voucher applied" value={`−${formatPrice(voucher)}`} tone="sale" />
            )}
          </dl>
          <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
            <span className="text-base font-bold text-ink">Total payment</span>
            <span className="text-base font-bold text-ink">{formatPrice(total)}</span>
          </div>
        </section>
      </div>

      <div className="sticky bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur">
        <div className="app-container py-3">
          {/* ABA collects first, so the order is only written once the shopper
              says they have paid. The other methods settle on delivery. */}
          <button
            type="button"
            onClick={() => {
              if (payment === 'aba') {
                setAbaReference(
                  `PL-${cartStore.id.slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-6)}`,
                )
                return
              }
              confirm()
            }}
            className="btn-primary w-full rounded-full py-3"
          >
            {payment === 'aba' ? 'Pay with ABA' : 'Place order'} — {formatPrice(total)}
          </button>
        </div>
      </div>

      {abaReference && (
        <AbaPayment
          store={cartStore}
          amount={total}
          reference={abaReference}
          onPaid={() => {
            const order = placeOrder(total, label)
            setAbaReference(null)
            if (order) setPlaced({ order, store: cartStore, reference: abaReference })
          }}
          onClose={() => setAbaReference(null)}
        />
      )}

      {speedSheet && (
        <OptionSheet
          title="Delivery options"
          value={speed}
          options={DELIVERY_CHOICES.map((option) => ({
            value: option.value,
            label: `${option.label} — ${formatPrice(option.fee)} · ${option.note}`,
          }))}
          onChange={(next) => {
            setSpeed(next)
            setSpeedSheet(false)
          }}
          onClose={() => setSpeedSheet(false)}
        />
      )}
    </Layout>
  )
}

function CheckoutBar() {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="app-container flex items-center gap-2 py-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="-ml-1.5 rounded-lg p-1.5 text-ink transition-colors hover:bg-surface"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="flex-1 text-center text-base font-bold text-ink">Checkout</h1>
        <span className="w-9 shrink-0" aria-hidden="true" />
      </div>
    </header>
  )
}

function Row({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'sale'
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className={`font-semibold ${tone === 'sale' ? 'text-sale' : 'text-ink'}`}>{value}</dd>
    </div>
  )
}

function AddressForm({
  address,
  onSave,
}: {
  address: DeliveryAddress
  onSave: (address: DeliveryAddress) => void
}) {
  const [draft, setDraft] = useState(address)

  const field = (key: keyof DeliveryAddress, label: string) => (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <input
        className="input"
        value={draft[key]}
        onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
      />
    </label>
  )

  return (
    <form
      className="mt-3 space-y-2.5"
      onSubmit={(event) => {
        event.preventDefault()
        onSave(draft)
      }}
    >
      {field('label', 'Label')}
      {field('phone', 'Phone')}
      {field('line1', 'Street and number')}
      {field('area', 'Area')}
      {field('city', 'City and postcode')}
      <button type="submit" className="btn-primary w-full">
        Save address
      </button>
    </form>
  )
}
