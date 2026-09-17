import { useEffect, useState } from 'react'
import type { Order, Store } from '../data'
import { TicketReceipt } from './TicketReceipt'

const SECONDS_ON_SCREEN = 5

/**
 * What the shopper sees the moment ABA has collected: the order as a ticket,
 * and a short countdown into tracking.
 */
export function OrderPlaced({
  order,
  store,
  reference,
  onDone,
}: {
  order: Order
  store: Store
  reference: string
  onDone: () => void
}) {
  const [left, setLeft] = useState(SECONDS_ON_SCREEN)

  useEffect(() => {
    // On a phone the shopper is over in the ABA app while this sits behind it,
    // so only count the seconds the receipt is actually in front of them.
    const tick = window.setInterval(() => {
      if (document.visibilityState === 'visible') setLeft((seconds) => seconds - 1)
    }, 1000)
    return () => window.clearInterval(tick)
  }, [])

  useEffect(() => {
    if (left <= 0) onDone()
  }, [left, onDone])

  return (
    <div
      className="fixed inset-0 z-[80] overflow-y-auto bg-navy-tint"
      role="dialog"
      aria-modal="true"
      aria-label="Order placed"
    >
      <div className="app-container flex min-h-full max-w-sm flex-col justify-center py-10">
        <TicketReceipt order={order} store={store} reference={reference} />

        {/* Waiting it out is the default, not a requirement. */}
        <button
          type="button"
          onClick={onDone}
          className="mx-auto mt-8 block rounded-lg px-3 py-1.5 text-center text-xs text-muted transition-colors hover:bg-white hover:text-navy"
        >
          <span aria-live="polite">Opening order tracking in {Math.max(left, 0)}s</span>
          <span className="ml-1 font-semibold text-navy">· Track now</span>
        </button>
      </div>
    </div>
  )
}
