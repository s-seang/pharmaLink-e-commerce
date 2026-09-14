import { MessageSquareText, Phone } from 'lucide-react'
import { useFooterClearance } from '../hooks/useFooterClearance'
import { useIsTouch } from '../hooks/useIsTouch'
import { telHref } from '../lib/geo'

/**
 * The store page's floating actions: call on top, text underneath.
 *
 * Phones get compact circles — there is no hover there, so permanent pills
 * would just sit on top of the products. Pointer devices get the full pills
 * with labels. The stack lifts to rest above the footer rather than floating
 * over it.
 */
export function StoreFabs({
  phone,
  storeName,
  onText,
  hidden = false,
}: {
  phone: string
  storeName: string
  onText: () => void
  /** Stays out of the way while the chat sheet is up. */
  hidden?: boolean
}) {
  const isTouch = useIsTouch()
  const lift = useFooterClearance()

  return (
    <div
      style={{ transform: `translateY(-${lift}px)` }}
      className={`fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 transition-opacity duration-200 ${
        hidden ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <a
        href={telHref(phone)}
        aria-label="Consult here"
        title={`Call ${storeName}`}
        className={`flex h-12 items-center justify-center rounded-full bg-teal text-white shadow-lg ring-2 ring-white transition-colors hover:bg-teal/90 focus-visible:outline-none focus-visible:ring-4 ${
          isTouch ? 'w-12' : 'gap-2 px-4'
        }`}
      >
        <Phone size={20} className="shrink-0" />
        {!isTouch && <span className="whitespace-nowrap text-sm font-semibold">Consult here</span>}
      </a>

      <TextFab onText={onText} storeName={storeName} isTouch={isTouch} />
    </div>
  )
}

/**
 * Pulls up the in-page chat sheet — it does not hand off to a messaging app.
 * Same teal as the call button, so the two read as one pair of store actions.
 */
function TextFab({
  onText,
  storeName,
  isTouch,
}: {
  onText: () => void
  storeName: string
  isTouch: boolean
}) {
  return (
    <button
      type="button"
      onClick={onText}
      aria-label="Text here"
      title={`Text ${storeName}`}
      className={`flex h-12 items-center justify-center rounded-full bg-teal text-white shadow-lg ring-2 ring-white transition-colors hover:bg-teal/90 focus-visible:outline-none focus-visible:ring-4 ${
        isTouch ? 'w-12' : 'gap-2 px-4'
      }`}
    >
      <MessageSquareText size={20} className="shrink-0" />
      {!isTouch && <span className="whitespace-nowrap text-sm font-semibold">Text here</span>}
    </button>
  )
}
