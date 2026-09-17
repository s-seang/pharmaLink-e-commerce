import { Banknote, CreditCard, Smartphone } from 'lucide-react'
import { formatPrice, getProduct, type Order, type Store } from '../data'
import { describeAmount } from '../lib/packaging'

/** "19 Jun 2025 • 10:15" */
function formatPlaced(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const day = date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  return `${day} • ${time}`
}

/**
 * The order as a torn-off ticket: a header stub, the details, and a barcode
 * below the perforation.
 *
 * The notches and the scalloped foot are drawn in `bg-surface`, so the ticket
 * has to sit on a surface-coloured page for its edges to read as cut-outs.
 */
export function TicketReceipt({
  order,
  store,
  reference,
}: {
  order: Order
  store: Store
  reference?: string
}) {
  const paid = order.payment ?? 'Paid'
  const PaidIcon = paid.includes('ABA') ? Smartphone : paid.includes('Cash') ? Banknote : CreditCard

  return (
    <div className="relative mx-auto w-full max-w-sm rounded-3xl bg-white shadow-[0_18px_48px_-24px_rgba(31,68,102,0.45)]">
      <div className="px-7 pb-8 pt-9 text-center">
        <SuccessTick />
        <h2 className="mt-4 text-2xl font-bold text-ink">Thank you!</h2>
        <p className="mx-auto mt-1.5 max-w-[15rem] text-sm leading-relaxed text-muted">
          Your order has been placed successfully
        </p>
      </div>

      <Perforation />

      <div className="space-y-5 px-7 py-7">
        <div className="flex items-start justify-between gap-4">
          <Field label="Order ID" value={order.id} />
          <Field label="Amount" value={formatPrice(order.total)} align="right" />
        </div>

        <Field label="Date & time" value={formatPlaced(order.placedOn)} />
        <Field label="Pharmacy" value={`${store.name} · ${store.branch}`} />

        <ul className="space-y-2 border-t border-dashed border-line pt-4">
          {order.lines.map((line) => {
            const product = getProduct(line.productId)
            return (
              <li key={line.lineId} className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">
                    {product?.name ?? 'Product'}
                  </span>
                  <span className="block text-xs text-muted">
                    {line.quantity} ×{' '}
                    {product
                      ? describeAmount(product, line.packaging, line.units, line.size)
                      : `${line.units} units`}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-ink">
                  {formatPrice(line.price * line.quantity)}
                </span>
              </li>
            )
          })}
        </ul>

        <div className="flex items-center gap-3 rounded-2xl bg-surface p-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-navy">
            <PaidIcon size={20} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-ink">{paid}</span>
            <span className="block truncate text-xs tracking-wider text-muted">
              •••• {(reference ?? order.id).slice(-4).toUpperCase()}
            </span>
          </span>
        </div>
      </div>

      <Perforation />

      <div className="px-7 pb-9 pt-7">
        <Barcode seed={reference ?? order.id} />
      </div>

      <Scallops />
    </div>
  )
}

/** Draws itself on mount: the ring sweeps round, then the tick strikes through. */
function SuccessTick() {
  return (
    <svg
      viewBox="0 0 52 52"
      className="tick mx-auto h-16 w-16"
      role="img"
      aria-label="Order confirmed"
    >
      <circle
        className="tick-ring"
        cx="26"
        cy="26"
        r="23"
        fill="none"
        stroke="#1F9D3D"
        strokeWidth="4"
        strokeLinecap="round"
        transform="rotate(-90 26 26)"
      />
      <path
        className="tick-mark"
        d="M14 27l8 8 16-18"
        fill="none"
        stroke="#1F9D3D"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** A dashed tear line, with a notch bitten out of each edge of the ticket. */
function Perforation() {
  return (
    <div className="relative h-0" aria-hidden="true">
      <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-navy-tint" />
      <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-navy-tint" />
      <div className="mx-9 border-t-2 border-dashed border-line" />
    </div>
  )
}

/** The cut foot of the ticket. */
function Scallops() {
  return (
    <div className="absolute inset-x-4 -bottom-3 flex justify-between" aria-hidden="true">
      {Array.from({ length: 14 }, (_, index) => (
        <span key={index} className="h-6 w-6 rounded-full bg-navy-tint" />
      ))}
    </div>
  )
}

function barsFrom(seed: string): number[] {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0
  }

  const bars: number[] = []
  for (let index = 0; index < 46; index += 1) {
    hash = (hash * 1664525 + 1013904223) >>> 0
    bars.push(hash >>> 16)
  }
  return bars
}

/**
 * Decorative bars, drawn from the order's own reference so a given order always
 * prints the same ones. Nothing scans them — there is no real ticketing system
 * behind this app.
 */
function Barcode({ seed }: { seed: string }) {
  const bars = barsFrom(seed)

  return (
    <div>
      <div className="flex h-16 justify-center" aria-hidden="true">
        {bars.map((value, index) => (
          <span
            key={index}
            className="bg-ink"
            style={{
              width: `${1 + (value % 3)}px`,
              marginRight: `${1 + ((value >> 2) % 2)}px`,
            }}
          />
        ))}
      </div>
      <p className="mt-2 text-center text-xs tracking-[0.3em] text-muted">
        {seed.replace(/\D/g, '') || seed}
      </p>
    </div>
  )
}

function Field({
  label,
  value,
  align = 'left',
}: {
  label: string
  value: string
  align?: 'left' | 'right'
}) {
  return (
    <div className={`min-w-0 ${align === 'right' ? 'text-right' : ''}`}>
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="truncate text-sm font-semibold text-ink">{value}</p>
    </div>
  )
}
