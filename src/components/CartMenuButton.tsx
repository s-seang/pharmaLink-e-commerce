import { ShoppingCart } from 'lucide-react'
import { useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useBackdropTone } from '../hooks/useBackdropTone'
import { useCartEntry } from '../hooks/useCartEntry'

/**
 * Floating cart button, carrying the same red count badge as the cart button in
 * the home header.
 *
 * Fixed to the top right of the viewport, so it stays put on pages that draw
 * their own top bar (search, product, store, stores, discounts) — including the
 * ones whose bar scrolls away. The icon reads the colour actually painted
 * behind it and flips white over dark backgrounds, navy over light ones.
 */
export function CartMenuButton() {
  const { cartCount } = useApp()
  const openTheCart = useCartEntry()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { pathname } = useLocation()
  const backdrop = useBackdropTone(buttonRef, [pathname])

  return (
    // The full-width strip keeps the button on the content column's right edge
    // at any width, rather than stranded in the margin on a wide screen.
    <div className="pointer-events-none fixed inset-x-0 top-3 z-50">
      <div className="app-container flex justify-end">
        <button
          ref={buttonRef}
          type="button"
          onClick={openTheCart}
          className={`pointer-events-auto relative rounded-full p-2 transition-colors duration-200 ${
            backdrop === 'dark'
              ? 'text-white drop-shadow hover:bg-white/15'
              : 'text-navy-deep hover:bg-navy-tint'
          }`}
          aria-label={`Open cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
        >
          <ShoppingCart size={22} />
          {cartCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-semibold text-white">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
