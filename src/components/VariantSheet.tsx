import { Check } from 'lucide-react'
import { useRef, useState } from 'react'
import { formatPrice, type CartLine, type Product } from '../data'
import { variantsFor, type Variant } from '../lib/packaging'

/** Drag past this and letting go dismisses the sheet rather than springing back. */
const DISMISS_AFTER = 90

/**
 * The forms a shop lists a product in, as a sheet that rises from the bottom
 * edge — the shape a thumb expects, rather than a dialog in the middle of the
 * screen.
 *
 * Sold-out forms stay on the list rather than disappearing: knowing the shop
 * sells a 100-tablet bottle but has none today is worth more than a gap.
 */
export function VariantSheet({
  line,
  product,
  onChoose,
  onClose,
}: {
  line: CartLine
  product: Product
  onChoose: (variant: Variant) => void
  onClose: () => void
}) {
  const variants = variantsFor(product, line.size)

  // How far the sheet has been dragged down, in pixels. Null while it is at
  // rest, so the spring-back transition only runs after a real drag.
  const [drag, setDrag] = useState<number | null>(null)
  const startY = useRef(0)

  const onPointerDown = (event: React.PointerEvent) => {
    startY.current = event.clientY
    setDrag(0)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: React.PointerEvent) => {
    if (drag === null) return
    // Only downwards: dragging up should not lift the sheet off its edge.
    setDrag(Math.max(0, event.clientY - startY.current))
  }

  const onPointerUp = () => {
    if (drag !== null && drag > DISMISS_AFTER) onClose()
    setDrag(null)
  }

  return (
    <div
      className="sheet-scrim fixed inset-0 z-[70] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Choose a variant of ${product.name}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="sheet-panel flex max-h-[60vh] w-full max-w-sm flex-col rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom,0px)] shadow-xl sm:rounded-2xl"
        style={{
          transform: drag ? `translateY(${drag}px)` : undefined,
          transition: drag === null ? 'transform 200ms cubic-bezier(0.2, 0, 0, 1)' : undefined,
        }}
      >
        {/* The grab area: drag it down to dismiss, or just tap it. */}
        <button
          type="button"
          onClick={onClose}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          aria-label="Close variants"
          className="flex w-full shrink-0 touch-none justify-center pb-1 pt-3"
        >
          <span aria-hidden="true" className="h-1.5 w-10 rounded-full bg-line" />
        </button>

        <div className="shrink-0 px-4 pb-3 pt-1">
          <h2 className="truncate text-base font-bold text-ink">{product.name}</h2>
          <p className="text-xs text-muted">Choose a variant</p>
        </div>

        <ul
          role="listbox"
          aria-label="Variants"
          className="flex-1 overflow-y-auto border-t border-line"
        >
          {variants.map((variant) => {
            const chosen = variant.kind === line.packaging && variant.units === line.units
            return (
              <li key={`${variant.kind}-${variant.units}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={chosen}
                  disabled={variant.soldOut}
                  onClick={() => onChoose(variant)}
                  className={`flex min-h-[56px] w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                    variant.soldOut
                      ? 'cursor-not-allowed opacity-50'
                      : chosen
                        ? 'bg-navy-tint/60'
                        : 'hover:bg-surface active:bg-surface'
                  }`}
                >
                  <span className="min-w-0">
                    <span
                      className={`block truncate text-sm ${
                        chosen ? 'font-semibold text-navy' : 'font-medium text-ink'
                      }`}
                    >
                      {variant.label}
                    </span>
                    {variant.soldOut && (
                      <span className="block text-xs text-muted">Out of stock</span>
                    )}
                  </span>

                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-bold text-navy">
                      {formatPrice(variant.price)}
                    </span>
                    {chosen && <Check size={18} className="text-navy" />}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
