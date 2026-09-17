import { MessageSquareText } from 'lucide-react'
import { useFooterClearance } from '../hooks/useFooterClearance'
import { useIsTouch } from '../hooks/useIsTouch'

/**
 * The store page's floating action: text the pharmacy.
 *
 * Calling lives inside the chat sheet now — one way in to talking to a shop,
 * with the choice of how made in there. Phones get a compact circle, since
 * there is no hover to reveal a label; pointer devices get the full pill.
 */
export function StoreFabs({
  storeName,
  onText,
  hidden = false,
}: {
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
