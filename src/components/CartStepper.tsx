import { Minus, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import type { Product } from '../data'

/** How long the stepper stays open before folding back to the count. */
const COLLAPSE_AFTER = 3000

/** Closed: one round button. Open: trash + count + add, side by side. */
const CLOSED_WIDTH = 40
const OPEN_WIDTH = 112

/**
 * The add control on product card artwork. It has three states:
 *
 * - nothing in the cart — a plain `+`;
 * - open — trash / count / `+`, so the quantity can be changed;
 * - closed with a count — a filled circle showing how many.
 *
 * Adding opens the stepper for {@link COLLAPSE_AFTER}ms and then folds it away,
 * so one tap stays one tap while a second thought is still cheap. Every press
 * restarts that countdown, and tapping the count opens it again — the quantity
 * is never more than one tap from being changed, but the grid is not left
 * cluttered with open steppers either.
 *
 * All three states are the same element rather than three, so the change is a
 * widening and a cross-fade instead of a pop. The control is anchored by its
 * right edge, so `+` holds still there while the pill grows leftward to make
 * room for the trash; the count rides the pill's centre and drifts left with
 * that growth, which is why it reads as one control changing shape rather than
 * two controls swapping places.
 */
export function CartStepper({ product }: { product: Product }) {
  const { cart, cartStoreId, addToCart, setQuantity, removeFromCart } = useApp()
  const quantity = cart.find((item) => item.productId === product.id)?.quantity ?? 0

  const [open, setOpen] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  const openFor = useCallback((ms: number = COLLAPSE_AFTER) => {
    window.clearTimeout(timer.current)
    setOpen(true)
    timer.current = window.setTimeout(() => setOpen(false), ms)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  /**
   * An add from another pharmacy is held back for the one-cart-per-pharmacy
   * prompt, so there is nothing to count up yet — leave the control closed
   * rather than opening a stepper over a product that was not added.
   */
  const heldForPrompt = cartStoreId !== null && cartStoreId !== product.storeId

  const add = () => {
    addToCart(product.id)
    if (!heldForPrompt) openFor()
  }

  // The open state is gated on a non-zero quantity, so emptying the line folds
  // the control back to a plain `+` on its own.
  const expanded = quantity > 0 && open
  const counting = quantity > 0 && !open

  const fade = 'transition-opacity duration-200 ease-out motion-reduce:transition-none'

  return (
    <div
      style={{ width: expanded ? OPEN_WIDTH : CLOSED_WIDTH }}
      className={`absolute bottom-2 right-2 h-10 rounded-full border shadow-md transition-[width,background-color,border-color] duration-300 ease-out motion-reduce:transition-none ${
        counting ? 'border-transparent bg-navy-deep' : 'border-line bg-white'
      }`}
    >
      {/* Tapping the closed circle reopens the stepper. It sits under the
          trash and `+`, which are inert whenever this one is live. */}
      <button
        type="button"
        onClick={() => openFor()}
        tabIndex={counting ? 0 : -1}
        aria-hidden={!counting}
        aria-label={`${quantity} of ${product.name} in cart — change quantity`}
        className={`absolute inset-0 rounded-full ${counting ? '' : 'pointer-events-none'}`}
      />

      {/* The count itself is decorative — every button's label carries it. */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-bold ${fade} ${
          quantity > 0 ? 'opacity-100' : 'opacity-0'
        } ${counting ? 'text-white' : 'text-ink'}`}
      >
        {quantity}
      </span>

      <button
        type="button"
        onClick={() => {
          if (quantity <= 1) removeFromCart(product.id)
          else {
            setQuantity(product.id, quantity - 1)
            openFor()
          }
        }}
        tabIndex={expanded ? 0 : -1}
        aria-hidden={!expanded}
        aria-label={
          quantity <= 1
            ? `Remove ${product.name} from cart`
            : `Decrease quantity of ${product.name}`
        }
        className={`absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full text-navy-deep transition-colors hover:bg-navy-tint ${fade} ${
          expanded ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        {quantity <= 1 ? <Trash2 size={17} /> : <Minus size={18} />}
      </button>

      {/* Pinned to the right edge — the one part that never moves. */}
      <button
        type="button"
        onClick={add}
        tabIndex={counting ? -1 : 0}
        aria-hidden={counting}
        aria-label={
          quantity > 0
            ? `Add another ${product.name}, ${quantity} in cart`
            : `Add ${product.name} to cart`
        }
        className={`absolute right-0 top-0 flex h-10 w-10 items-center justify-center rounded-full text-navy-deep transition-colors hover:bg-navy-tint ${fade} ${
          counting ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        <Plus size={20} />
      </button>
    </div>
  )
}
