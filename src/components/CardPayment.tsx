import { AlertCircle, HelpCircle, Info, Lock, X } from 'lucide-react'
import { useState } from 'react'
import { formatPrice } from '../data'

/** "1456 1298 6574 1287" — grouped as it is printed on the card. */
function formatNumber(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim()
}

/** "02/28", with the slash typed for you. */
function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`
}

/**
 * Shape only — a real month and a year, not whether it has passed. Expired
 * cards are the processor's call to make, and this demo has no processor.
 */
function expiryValid(value: string): boolean {
  const match = /^(\d{2})\/(\d{2})$/.exec(value)
  if (!match) return false
  const month = Number(match[1])
  return month >= 1 && month <= 12
}

/**
 * Browsers refuse to autofill card fields on an http:// page and say so in a
 * warning of their own. Served over plain http on a phone, that lands on top
 * of this form — so the fields opt out of payment autofill entirely and the
 * notice is shown up here instead, in the sheet's own voice.
 */
const INSECURE = typeof window !== 'undefined' && !window.isSecureContext

/**
 * The card step: the details, then the amount on the button so the shopper is
 * never guessing what they are about to pay.
 *
 * Nothing typed here is stored or sent anywhere — there is no payment
 * processor behind this app, and the order records only that a card was used.
 * The fields live in this component's state and go with it when it closes.
 */
export function CardPayment({
  amount,
  onPaid,
  onClose,
}: {
  amount: number
  onPaid: () => void
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [number, setNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [showCvvHint, setShowCvvHint] = useState(false)
  const [tried, setTried] = useState(false)

  const digits = number.replace(/\D/g, '')
  const errors = {
    name: name.trim().length < 2 ? 'Enter the name printed on the card' : '',
    number: digits.length < 12 ? 'Enter the long number on the front' : '',
    expiry: expiryValid(expiry) ? '' : 'Use MM/YY',
    cvv: /^\d{3,4}$/.test(cvv) ? '' : '3 or 4 digits',
  }
  const ready = Object.values(errors).every((error) => error === '')
  const blur = (field: string) => setTouched((current) => ({ ...current, [field]: true }))

  // Errors take the slot while there are any; otherwise it carries the
  // autofill notice, so only ever one message sits above the fields.
  const alert =
    tried && !ready
      ? { tone: 'error' as const, text: 'Check the highlighted fields and try again.' }
      : INSECURE
        ? { tone: 'info' as const, text: 'Autofill is off — this demo is not served over HTTPS.' }
        : null

  return (
    <div
      className="sheet-scrim fixed inset-0 z-[70] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          setTried(true)
          setTouched({ name: true, number: true, expiry: true, cvv: true })
          if (ready) onPaid()
        }}
        className="sheet-panel max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-t-2xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="card-title" className="text-xl font-bold text-ink">
            Payment Details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1.5 -mt-1 rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-ink"
            aria-label="Cancel payment"
          >
            <X size={20} />
          </button>
        </div>

        {alert && (
          <p
            className={`mt-4 flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs leading-relaxed ${
              alert.tone === 'error'
                ? 'bg-sale/10 text-sale'
                : 'bg-navy-tint text-navy'
            }`}
            role={alert.tone === 'error' ? 'alert' : undefined}
          >
            {alert.tone === 'error' ? (
              <AlertCircle size={15} className="mt-px shrink-0" />
            ) : (
              <Info size={15} className="mt-px shrink-0" />
            )}
            {alert.text}
          </p>
        )}

        <div className="mt-5 space-y-5">
          <Field
            label="Name on Card"
            error={touched.name ? errors.name : ''}
            value={name}
            onChange={setName}
            onBlur={() => blur('name')}
            placeholder="Jack Sparrow"
            autoComplete="off"
          />

          <Field
            label="Card Number"
            error={touched.number ? errors.number : ''}
            value={number}
            onChange={(next) => setNumber(formatNumber(next))}
            onBlur={() => blur('number')}
            placeholder="1456 1298 6574 1287"
            inputMode="numeric"
            autoComplete="off"
          />

          <div className="flex gap-4">
            <Field
              className="flex-1"
              label="Valid Through"
              error={touched.expiry ? errors.expiry : ''}
              value={expiry}
              onChange={(next) => setExpiry(formatExpiry(next))}
              onBlur={() => blur('expiry')}
              placeholder="02/28"
              inputMode="numeric"
              autoComplete="off"
            />

            <Field
              className="flex-1"
              label="CVV"
              error={touched.cvv ? errors.cvv : ''}
              value={cvv}
              onChange={(next) => setCvv(next.replace(/\D/g, '').slice(0, 4))}
              onBlur={() => blur('cvv')}
              placeholder="208"
              inputMode="numeric"
              autoComplete="off"
              action={
                <button
                  type="button"
                  onClick={() => setShowCvvHint((on) => !on)}
                  aria-label="What is a CVV?"
                  aria-expanded={showCvvHint}
                  className="shrink-0 text-muted transition-colors hover:text-navy"
                >
                  <HelpCircle size={16} />
                </button>
              }
            />
          </div>

          {showCvvHint && (
            <p className="-mt-2 text-xs text-muted">
              The last three digits printed on the signature strip, on the back of the card.
            </p>
          )}
        </div>

        <button
          type="submit"
          className="btn-primary mt-6 w-full rounded-xl py-3.5 text-base tracking-wide"
        >
          PAY {formatPrice(amount)}
        </button>

        <p className="mt-3 flex items-start gap-2 text-xs text-muted">
          <Lock size={14} className="mt-0.5 shrink-0 text-teal" />
          A demo card form — nothing is charged, and no card details are sent or saved anywhere.
        </p>
      </form>
    </div>
  )
}

/** A label over an underlined input, the way a card is read off in columns. */
function Field({
  label,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  inputMode,
  autoComplete,
  action,
  className = '',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  error: string
  placeholder?: string
  inputMode?: 'numeric' | 'text'
  autoComplete?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <label className={`block text-muted focus-within:text-navy ${className}`}>
      <span className="block text-xs font-medium transition-colors">{label}</span>
      <span className="flex items-center gap-2">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          inputMode={inputMode}
          autoComplete={autoComplete}
          className={`w-full min-w-0 border-0 border-b bg-transparent px-0 py-2 text-base text-ink outline-none transition-colors placeholder:text-line focus:border-navy ${
            error ? 'border-sale' : 'border-line'
          }`}
        />
        {action}
      </span>
      {error && <span className="mt-1 block text-xs text-sale">{error}</span>}
    </label>
  )
}
