import { Check, ExternalLink, Loader2, ShieldCheck, Smartphone, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { formatPrice, type Store } from '../data'
import { isMobileDevice, openAbaApp } from '../lib/aba'
import { khqrPayload } from '../lib/khqr'

/**
 * The ABA payment step: a KHQR code carrying the shop's own account and the
 * exact amount owed, which the shopper scans in the ABA app.
 *
 * The accounts in this app are mock, so scanning will not move real money —
 * but the code is a properly formed KHQR with the real amount and reference,
 * not a picture of one, so swapping in live merchant accounts is all that
 * stands between this and a working payment.
 */
export function AbaPayment({
  store,
  amount,
  reference,
  onPaid,
  onClose,
}: {
  store: Store
  amount: number
  reference: string
  onPaid: () => void
  onClose: () => void
}) {
  const [qr, setQr] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  // A phone can hand off to the ABA app; a laptop has no ABA to open, so it
  // sends the shopper to their phone instead.
  const onPhone = isMobileDevice()

  useEffect(() => {
    let live = true
    const payload = khqrPayload({
      account: store.abaAccount,
      merchantName: store.name,
      city: 'Phnom Penh',
      amount,
      reference,
    })

    QRCode.toDataURL(payload, { width: 512, margin: 1, errorCorrectionLevel: 'M' })
      .then((url) => {
        if (live) setQr(url)
      })
      .catch(() => {
        if (live) setFailed(true)
      })

    return () => {
      live = false
    }
  }, [store.abaAccount, store.name, amount, reference])

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="aba-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="aba-title" className="text-base font-bold text-ink">
              Pay with ABA
            </h2>
            <p className="text-xs text-muted">
              {onPhone ? 'Pay in the ABA app and come back' : 'Scan with ABA Mobile on your phone'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1.5 -mt-1.5 rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-ink"
            aria-label="Cancel payment"
          >
            <X size={20} />
          </button>
        </div>

        {onPhone ? (
          <button
            type="button"
            onClick={() => {
              openAbaApp()
              onPaid()
            }}
            className="btn-primary mt-4 w-full rounded-full"
          >
            <ExternalLink size={18} />
            Open ABA Mobile app
          </button>
        ) : (
          <p className="mt-4 flex items-start gap-2 rounded-card bg-navy-tint p-3 text-xs text-navy">
            <Smartphone size={14} className="mt-0.5 shrink-0" />
            Take out your phone, open ABA Mobile and scan the code below to pay.
          </p>
        )}

        <div className="mt-4 flex flex-col items-center rounded-card border border-line bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {store.name}'s KHQR code
          </p>
          <p className="text-center text-sm font-bold text-ink">{store.name}</p>
          <p className="text-center text-xs text-muted">{store.abaAccount}</p>

          <div className="my-4 flex h-52 w-52 items-center justify-center rounded-lg bg-white p-2">
            {qr ? (
              <img
                src={qr}
                alt={`KHQR code to pay ${formatPrice(amount)} to ${store.name}`}
                className="h-full w-full"
              />
            ) : failed ? (
              <p className="px-3 text-center text-xs text-muted">
                The code could not be drawn. Choose another payment method.
              </p>
            ) : (
              <Loader2 size={24} className="animate-spin text-muted" />
            )}
          </div>

          <p className="text-2xl font-bold text-navy">{formatPrice(amount)}</p>
          <p className="mt-1 text-[11px] text-muted">Ref {reference}</p>
        </div>

        <p className="mt-3 flex items-start gap-2 text-xs text-muted">
          <ShieldCheck size={14} className="mt-0.5 shrink-0 text-teal" />
          {onPhone
            ? 'These are demo merchant accounts, so no money actually moves — opening ABA records the order.'
            : 'These are demo merchant accounts, so no money actually moves. Tap below once you have scanned.'}
        </p>

        {!onPhone && (
          <button type="button" onClick={onPaid} className="btn-primary mt-4 w-full">
            <Check size={18} />
            I have paid
          </button>
        )}
      </div>
    </div>
  )
}
