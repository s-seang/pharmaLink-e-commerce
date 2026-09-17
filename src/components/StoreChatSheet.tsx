import { Camera, Image, Mic, Paperclip, Phone, Send, Square, Trash2, Video, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Store } from '../data'
import { telHref } from '../lib/geo'
import { CameraCapture, type CaptureKind } from './CameraCapture'
import { StoreLogo } from './StoreLogo'

interface Message {
  id: number
  from: 'you' | 'store'
  text: string
  at: Date
  /** Object URL of a recording made in the composer, for voice messages. */
  audio?: string
  seconds?: number
  /** A photo or clip the shopper attached, as an object URL. */
  media?: { url: string; kind: 'image' | 'video' }
}

/** Voice notes need both halves of the API; older browsers get no mic button. */
const CAN_RECORD =
  typeof window !== 'undefined' &&
  'MediaRecorder' in window &&
  typeof navigator.mediaDevices?.getUserMedia === 'function'

/** "0:07" */
function clock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
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

  const [attaching, setAttaching] = useState(false)
  /** Which camera is open, if either. */
  const [camera, setCamera] = useState<CaptureKind | null>(null)
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [micError, setMicError] = useState('')
  const recorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<BlobPart[]>([])
  const secondsTimer = useRef<number>(0)
  /** Kept so they can be revoked — an object URL outlives the blob otherwise. */
  const audioUrls = useRef<string[]>([])

  /**
   * One hidden input per source. `capture` is what turns the picker into the
   * camera on a phone, so choosing a file and shooting one need their own.
   */
  const libraryPicker = useRef<HTMLInputElement>(null)

  const attach = (file: Blob | undefined, forced?: CaptureKind) => {
    setAttaching(false)
    if (!file) return
    const kind = forced ?? (file.type.startsWith('video') ? ('video' as const) : ('image' as const))
    const url = URL.createObjectURL(file)
    audioUrls.current.push(url)
    setMessages((current) => [
      ...current,
      { id: current.length, from: 'you', text: '', at: new Date(), media: { url, kind } },
    ])
    answer()
  }

  const stopStream = () => {
    recorder.current?.stream.getTracks().forEach((track) => track.stop())
    recorder.current = null
    window.clearInterval(secondsTimer.current)
    setRecording(false)
  }

  const startRecording = async () => {
    setMicError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const media = new MediaRecorder(stream)
      chunks.current = []
      media.ondataavailable = (event) => chunks.current.push(event.data)
      media.start()
      recorder.current = media
      setSeconds(0)
      setRecording(true)
      secondsTimer.current = window.setInterval(() => setSeconds((n) => n + 1), 1000)
    } catch {
      setMicError('Microphone access is needed to record a voice message.')
    }
  }

  /** Stop, and either send what was captured or throw it away. */
  const finishRecording = (send: boolean) => {
    const media = recorder.current
    if (!media) return
    const held = seconds

    media.onstop = () => {
      if (send && chunks.current.length > 0) {
        const url = URL.createObjectURL(new Blob(chunks.current, { type: media.mimeType }))
        audioUrls.current.push(url)
        setMessages((current) => [
          ...current,
          { id: current.length, from: 'you', text: '', at: new Date(), audio: url, seconds: held },
        ])
        answer()
      }
      chunks.current = []
    }

    media.stop()
    stopStream()
  }

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
      if (event.key !== 'Escape') return
      // The menu is the innermost thing open, so it closes first.
      setAttaching((open) => {
        if (!open) onClose()
        return false
      })
    }

    document.addEventListener('keydown', onKey)
    inputRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  useEffect(
    () => () => {
      window.clearTimeout(replyTimer.current)
      window.clearInterval(secondsTimer.current)
      recorder.current?.stream.getTracks().forEach((track) => track.stop())
      audioUrls.current.forEach((url) => URL.revokeObjectURL(url))
    },
    [],
  )

  const answer = () => {
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

  const send = (event: FormEvent) => {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return

    setDraft('')
    setMessages((current) => [...current, { id: current.length, from: 'you', text, at: new Date() }])
    answer()
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
          <a
            href={telHref(store.phone)}
            aria-label={`Call ${store.name}`}
            title={`Call ${store.name}`}
            className="rounded-full bg-teal-tint p-2 text-teal transition-colors hover:bg-teal hover:text-white"
          >
            <Phone size={18} />
          </a>
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
                  message.audio || message.media
                    ? 'rounded-br-sm border border-line bg-white text-ink'
                    : message.from === 'you'
                      ? 'rounded-br-sm bg-teal text-white'
                      : 'rounded-bl-sm border border-line bg-white text-ink'
                }`}
              >
                {message.media ? (
                  message.media.kind === 'video' ? (
                    <video
                      controls
                      src={message.media.url}
                      className="max-h-56 w-56 max-w-full rounded-lg"
                    >
                      <track kind="captions" />
                    </video>
                  ) : (
                    <img
                      src={message.media.url}
                      alt="Attachment"
                      className="max-h-56 w-56 max-w-full rounded-lg object-cover"
                    />
                  )
                ) : message.audio ? (
                  <>
                    <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                      <Mic size={13} className="text-teal" />
                      Voice message · {clock(message.seconds ?? 0)}
                    </p>
                    <audio controls src={message.audio} className="mt-1.5 h-9 w-48 max-w-full">
                      <track kind="captions" />
                    </audio>
                  </>
                ) : (
                  <p className="whitespace-pre-wrap">{message.text}</p>
                )}
                <p
                  className={`mt-1 text-[11px] ${
                    message.from === 'you' && !message.audio && !message.media
                      ? 'text-white/60'
                      : 'text-muted'
                  }`}
                >
                  {message.at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {micError && (
          <p className="border-t border-line bg-surface px-4 py-2 text-xs text-sale">{micError}</p>
        )}

        {recording ? (
          <div className="flex items-center gap-2 border-t border-line p-3">
            <button
              type="button"
              onClick={() => finishRecording(false)}
              className="btn shrink-0 rounded-full px-3 py-3 text-muted hover:bg-surface hover:text-sale"
              aria-label="Discard recording"
            >
              <Trash2 size={18} />
            </button>

            <p className="flex flex-1 items-center gap-2 text-sm font-medium text-ink" aria-live="polite">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-sale" aria-hidden="true" />
              Recording… {clock(seconds)}
            </p>

            <button
              type="button"
              onClick={() => finishRecording(true)}
              className="btn shrink-0 rounded-full bg-teal px-3.5 py-3 text-white hover:bg-teal/90"
              aria-label="Stop and send voice message"
            >
              <Square size={18} fill="currentColor" />
            </button>
          </div>
        ) : (
          <form onSubmit={send} className="relative flex items-center gap-2 border-t border-line p-3">
            {/* Anywhere else dismisses the menu, the way a menu should. */}
            {attaching && (
              <button
                type="button"
                aria-label="Close attachment menu"
                onClick={() => setAttaching(false)}
                className="fixed inset-0 z-10 cursor-default"
              />
            )}

            {attaching && (
              <div className="absolute bottom-full left-3 z-20 mb-2 w-52 overflow-hidden rounded-xl border border-line bg-white shadow-xl">
                <AttachOption
                  icon={Image}
                  label="Photo or video"
                  onClick={() => libraryPicker.current?.click()}
                />
                <AttachOption
                  icon={Camera}
                  label="Take a photo"
                  onClick={() => {
                    setAttaching(false)
                    setCamera('image')
                  }}
                />
                <AttachOption
                  icon={Video}
                  label="Record a video"
                  onClick={() => {
                    setAttaching(false)
                    setCamera('video')
                  }}
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => setAttaching((on) => !on)}
              aria-expanded={attaching}
              aria-label="Attach a photo or video"
              className={`btn shrink-0 rounded-full px-3 py-3 ${
                attaching ? 'bg-teal-tint text-teal' : 'text-teal hover:bg-teal-tint'
              }`}
            >
              <Paperclip size={18} />
            </button>

            <input
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={`Message ${store.name}…`}
              aria-label="Your message"
              className="input flex-1 rounded-full focus:border-teal"
            />

            {CAN_RECORD && !draft.trim() && (
              <button
                type="button"
                onClick={startRecording}
                className="btn shrink-0 rounded-full px-3 py-3 text-teal hover:bg-teal-tint"
                aria-label="Record a voice message"
              >
                <Mic size={18} />
              </button>
            )}

            <button
              type="submit"
              disabled={!draft.trim()}
              className="btn shrink-0 rounded-full bg-teal px-3.5 py-3 text-white hover:bg-teal/90"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>

            <input
              ref={libraryPicker}
              type="file"
              accept="image/*,video/*"
              hidden
              onChange={(event) => attach(event.target.files?.[0])}
            />
          </form>
        )}
      </aside>

      {camera && (
        <CameraCapture
          kind={camera}
          onCapture={(blob, kind) => attach(blob, kind)}
          onClose={() => setCamera(null)}
        />
      )}
    </>
  )
}

function AttachOption({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Camera
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-ink transition-colors hover:bg-surface"
    >
      <Icon size={17} className="shrink-0 text-teal" />
      {label}
    </button>
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
