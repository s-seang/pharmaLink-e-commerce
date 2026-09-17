import { CreditCard, Lock, Smartphone, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useApp, type SavedPayment } from '../context/AppContext'

/** "Visa", "Mastercard" — read off the first digits, the way a terminal does. */
function brandOf(digits: string): string {
  if (digits.startsWith('4')) return 'Visa'
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'Mastercard'
  if (/^3[47]/.test(digits)) return 'American Express'
  return 'Card'
}

function formatNumber(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim()
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`
}

/**
 * Saving a way to pay, so checkout is one tap next time.
 *
 * The card number is read to work out the brand and the last four digits, and
 * then dropped — only those two survive the form. There is no processor behind
 * this app to hand a real number to, and nothing here should be holding one.
 */
export function PaymentMethodSheet({ onClose }: { onClose: () => void }) {
  const { savePayment, address } = useApp()
  const [tab, setTab] = useState<'card' | 'aba'>('card')

  const [number, setNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [error, setError] = useState('')

  const digits = number.replace(/\D/g, '')

  const submit = (event: FormEvent) => {
    event.preventDefault()

    if (tab === 'aba') {
      savePayment({ kind: 'aba', label: `ABA · ${address.phone}` })
      onClose()
      return
    }

    if (digits.length < 12) {
      setError('Enter the long number on the front of the card.')
      return
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      setError('Enter the expiry as MM/YY.')
      return
    }

    savePayment({
      kind: 'card',
      label: brandOf(digits),
      last4: digits.slice(-4),
      expiry,
    } satisfies SavedPayment)
    onClose()
  }

  return (
    <div
      className="sheet-scrim fixed inset-0 z-[70] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pay-method-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <form
        onSubmit={submit}
        className="sheet-panel max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-t-2xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="pay-method-title" className="text-lg font-bold text-ink">
            Save a payment method
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1.5 -mt-1 rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-ink"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 rounded-lg bg-surface p-1">
          {(['card', 'aba'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setTab(value)
                setError('')
              }}
              aria-pressed={tab === value}
              className={`flex items-center justify-center gap-2 rounded-md py-2 text-sm font-semibold transition-colors ${
                tab === value ? 'bg-white text-navy shadow-sm' : 'text-muted'
              }`}
            >
              {value === 'card' ? <CreditCard size={16} /> : <Smartphone size={16} />}
              {value === 'card' ? 'Card' : 'ABA'}
            </button>
          ))}
        </div>

        {tab === 'card' ? (
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink">Card Number</span>
              <input
                className="pill-input"
                value={number}
                onChange={(event) => setNumber(formatNumber(event.target.value))}
                placeholder="4111 1111 1111 1111"
                inputMode="numeric"
                autoComplete="off"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink">Valid Through</span>
              <input
                className="pill-input"
                value={expiry}
                onChange={(event) => setExpiry(formatExpiry(event.target.value))}
                placeholder="02/28"
                inputMode="numeric"
                autoComplete="off"
              />
            </label>
          </div>
        ) : (
          <p className="mt-4 rounded-xl bg-navy-tint p-3.5 text-sm leading-relaxed text-navy">
            Link the ABA account on {address.phone}. Orders then settle from it without opening the
            app each time.
          </p>
        )}

        {error && <p className="mt-3 text-xs font-medium text-sale">{error}</p>}

        <button
          type="submit"
          className="mt-5 w-full rounded-full bg-navy-deep py-3.5 text-sm font-bold text-white transition-colors hover:bg-navy"
        >
          {tab === 'card' ? 'Save card' : 'Link ABA account'}
        </button>

        <p className="mt-3 flex items-start gap-2 text-xs text-muted">
          <Lock size={14} className="mt-0.5 shrink-0 text-teal" />
          Only the brand and last four digits are kept. The full number is never stored, and nothing
          is charged here.
        </p>
      </form>
    </div>
  )
}
