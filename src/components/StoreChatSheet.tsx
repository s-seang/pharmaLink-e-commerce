import { Send, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Store } from '../data'
import { StoreLogo } from './StoreLogo'

interface Message {
  id: number
  from: 'you' | 'store'
  text: string
  at: Date
}

/** Placeholder replies until the chat is wired to a real backend. */
const CANNED_REPLIES = [
  'Thanks for your message — one of our pharmacists will be with you shortly.',
  'We have that in stock. Would you like it delivered or set aside for pickup?',
  'Happy to help with that. Could you tell us a little more?',
]

/**
 * Pull-up chat sheet for a store. It covers the products and everything below,
 * but stops underneath the navy band, so the store's name and rating stay
 * visible while you type. The top edge tracks the band as the page scrolls, and
 * clamps to the top of the viewport once the band has scrolled away.
 */
/** How far the sheet must be pulled down before releasing dismisses it. */
const DISMISS_AT = 120

export function StoreChatSheet({
  store,
  open,
  onClose,
}: {
  store: Store
  open: boolean
  onClose: () => void
}) {
  const top = useBandBottom()
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      from: 'store',
      text: `Hi, you're chatting with ${store.name}. How can we help today?`,
      at: new Date(),
    },
  ])

  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const replyTimer = useRef<number>(0)

  // Drag-to-dismiss: pull the sheet down past DISMISS_AT and it closes.
  const [drag, setDrag] = useState(0)
  const dragFrom = useRef<number | null>(null)

  const startDrag = (event: React.PointerEvent) => {
    dragFrom.current = event.clientY
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const moveDrag = (event: React.PointerEvent) => {
    if (dragFrom.current === null) return
    // Downward only — dragging up should not lift the sheet off its anchor.
    setDrag(Math.max(0, event.clientY - dragFrom.current))
  }

  const endDrag = () => {
    if (dragFrom.current === null) return
    dragFrom.current = null
    if (drag > DISMISS_AT) onClose()
    setDrag(0)
  }

  useEffect(() => {
    if (!open) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKey)
    inputRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  useEffect(() => () => window.clearTimeout(replyTimer.current), [])

  const send = (event: FormEvent) => {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return

    setDraft('')
    setMessages((current) => [...current, { id: current.length, from: 'you', text, at: new Date() }])

    window.clearTimeout(replyTimer.current)
    replyTimer.current = window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: current.length,
          from: 'store',
          text: CANNED_REPLIES[current.length % CANNED_REPLIES.length],
          at: new Date(),
        },
      ])
    }, 900)
  }

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{ top }}
        className={`fixed inset-x-0 bottom-0 z-[55] bg-black/40 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        role="dialog"
        aria-modal="false"
        aria-label={`Chat with ${store.name}`}
        aria-hidden={!open}
        style={{
          top,
          transform: drag ? `translateY(${drag}px)` : undefined,
          transition: drag ? 'none' : undefined,
        }}
        className={`fixed inset-x-0 bottom-0 z-[56] flex flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none ${
          open ? 'translate-y-0' : 'pointer-events-none translate-y-full'
        }`}
      >
        {/* Grab handle. Drag this or the header downwards to dismiss. */}
        <div
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="flex cursor-grab touch-none justify-center py-2.5 active:cursor-grabbing"
          role="button"
          tabIndex={-1}
          aria-label="Drag down to close chat"
        >
          <span className="h-1 w-10 rounded-full bg-line" aria-hidden="true" />
        </div>

        <header
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="flex touch-none items-center gap-3 border-b border-line px-4 pb-3"
        >
          <StoreLogo store={store} size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{store.name}</p>
            <p className="truncate text-xs text-muted">Usually replies within a few minutes</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-ink"
            aria-label="Close chat"
          >
            <X size={20} />
          </button>
        </header>

        <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-surface px-4 py-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.from === 'you' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                  message.from === 'you'
                    ? 'rounded-br-sm bg-teal text-white'
                    : 'rounded-bl-sm border border-line bg-white text-ink'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
                <p
                  className={`mt-1 text-[11px] ${
                    message.from === 'you' ? 'text-white/60' : 'text-muted'
                  }`}
                >
                  {message.at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={send} className="flex items-center gap-2 border-t border-line p-3">
          <input
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={`Message ${store.name}…`}
            aria-label="Your message"
            className="input flex-1 rounded-full focus:border-teal"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="btn shrink-0 rounded-full bg-teal px-3.5 py-3 text-white hover:bg-teal/90"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </form>
      </aside>
    </>
  )
}

/** Bottom edge of the store's navy band, in viewport coordinates. */
function useBandBottom(): number {
  const [top, setTop] = useState(0)

  useEffect(() => {
    let frame = 0

    const measure = () => {
      frame = 0
      const band = document.querySelector('[data-store-band]')
      const next = band ? Math.max(0, Math.round(band.getBoundingClientRect().bottom)) : 0
      setTop((current) => (current === next ? current : next))
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  return top
}
