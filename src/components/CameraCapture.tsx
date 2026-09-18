import { Circle, RotateCcw, Square, SwitchCamera, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export type CaptureKind = 'image' | 'video'

/** "0:07" */
function clock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

/**
 * Recording through a canvas lets the camera be swapped mid-take: the recorder
 * is fed the canvas, and the canvas keeps painting whatever the preview shows.
 * Without it the recorder is bound to one camera's track and flipping would cut
 * the clip short.
 */
const CAN_FLIP_MID_TAKE =
  typeof HTMLCanvasElement !== 'undefined' &&
  typeof HTMLCanvasElement.prototype.captureStream === 'function'

/** Paint a frame filling the canvas, cropping rather than squashing. */
function drawCover(
  context: CanvasRenderingContext2D,
  source: HTMLVideoElement,
  width: number,
  height: number,
): void {
  const sw = source.videoWidth
  const sh = source.videoHeight
  if (!sw || !sh) return

  const scale = Math.max(width / sw, height / sh)
  const dw = sw * scale
  const dh = sh * scale
  context.drawImage(source, (width - dw) / 2, (height - dh) / 2, dw, dh)
}

/**
 * The device camera, live in the page.
 *
 * A file input with `capture` opens the camera app on a phone but only a file
 * picker everywhere else, so the shot is taken here instead: a preview stream,
 * a shutter that grabs a frame, and a recorder on the same picture.
 *
 * Nothing leaves this screen on its own. A shot lands on a review step — retake
 * it, or hand it to the composer, where it waits as a draft until it is sent.
 */
export function CameraCapture({
  kind,
  onCapture,
  onClose,
}: {
  /** Limits the camera to one job. Left off, it can do either. */
  kind?: CaptureKind
  onCapture: (blob: Blob, kind: CaptureKind) => void
  onClose: () => void
}) {
  const preview = useRef<HTMLVideoElement>(null)
  const videoStream = useRef<MediaStream | null>(null)
  const micStream = useRef<MediaStream | null>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<BlobPart[]>([])
  const canvas = useRef<HTMLCanvasElement | null>(null)
  const painter = useRef<number>(0)
  const timer = useRef<number>(0)
  const shotUrl = useRef<string>('')

  const [error, setError] = useState('')
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  /** Which way the camera points. Flipping re-opens the stream. */
  const [facing, setFacing] = useState<'environment' | 'user'>('environment')
  const [canFlip, setCanFlip] = useState(false)
  /** Dips the preview while the other camera warms up. */
  const [switching, setSwitching] = useState(true)
  /** What was just taken, waiting on retake or use. */
  const [shot, setShot] = useState<{ url: string; blob: Blob; kind: CaptureKind } | null>(null)

  useEffect(() => {
    let live = true

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: facing } })
      .then((media) => {
        if (!live) {
          media.getTracks().forEach((track) => track.stop())
          return
        }

        // The old camera is released only once the new one is running, so the
        // preview crossfades instead of going black in between.
        const previous = videoStream.current
        videoStream.current = media
        if (preview.current) preview.current.srcObject = media
        previous?.getTracks().forEach((track) => track.stop())
        setSwitching(false)

        // Only offer the flip where there is somewhere to flip to.
        navigator.mediaDevices
          .enumerateDevices()
          .then((devices) => {
            if (live) setCanFlip(devices.filter((d) => d.kind === 'videoinput').length > 1)
          })
          .catch(() => undefined)
      })
      .catch(() => {
        if (!live) return
        setError('PharmaLink needs permission to use your camera.')
        setSwitching(false)
      })

    return () => {
      live = false
    }
  }, [facing])

  // Everything the camera holds open, handed back when the screen goes away.
  useEffect(
    () => () => {
      window.clearInterval(timer.current)
      cancelAnimationFrame(painter.current)
      if (recorder.current?.state === 'recording') recorder.current.stop()
      videoStream.current?.getTracks().forEach((track) => track.stop())
      micStream.current?.getTracks().forEach((track) => track.stop())
      if (shotUrl.current) URL.revokeObjectURL(shotUrl.current)
    },
    [],
  )

  const hold = (blob: Blob, taken: CaptureKind) => {
    if (shotUrl.current) URL.revokeObjectURL(shotUrl.current)
    shotUrl.current = URL.createObjectURL(blob)
    setShot({ url: shotUrl.current, blob, kind: taken })
  }

  /** Grab the current frame off the preview. */
  const shoot = () => {
    const source = preview.current
    if (!source?.videoWidth) return

    const frame = document.createElement('canvas')
    frame.width = source.videoWidth
    frame.height = source.videoHeight
    frame.getContext('2d')?.drawImage(source, 0, 0)
    frame.toBlob(
      (blob) => {
        if (blob) hold(blob, 'image')
      },
      'image/jpeg',
      0.9,
    )
  }

  const startRecording = async () => {
    const source = preview.current
    if (!source) return

    let recorded: MediaStream

    if (CAN_FLIP_MID_TAKE && source.videoWidth) {
      const board = canvas.current ?? document.createElement('canvas')
      canvas.current = board
      board.width = source.videoWidth
      board.height = source.videoHeight

      const context = board.getContext('2d')
      const paint = () => {
        if (context) drawCover(context, source, board.width, board.height)
        painter.current = requestAnimationFrame(paint)
      }
      paint()

      recorded = board.captureStream(30)
    } else {
      // No canvas capture: record the camera directly and leave the flip out.
      if (!videoStream.current) return
      recorded = new MediaStream(videoStream.current.getVideoTracks())
    }

    try {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true })
      micStream.current = mic
      mic.getAudioTracks().forEach((track) => recorded.addTrack(track))
    } catch {
      // A silent clip beats no clip at all.
    }

    const media = new MediaRecorder(recorded)
    chunks.current = []
    media.ondataavailable = (event) => chunks.current.push(event.data)
    media.onstop = () => {
      cancelAnimationFrame(painter.current)
      painter.current = 0
      micStream.current?.getTracks().forEach((track) => track.stop())
      micStream.current = null
      if (chunks.current.length > 0) hold(new Blob(chunks.current, { type: media.mimeType }), 'video')
      chunks.current = []
    }

    media.start()
    recorder.current = media
    setSeconds(0)
    setRecording(true)
    timer.current = window.setInterval(() => setSeconds((value) => value + 1), 1000)
  }

  const stopRecording = () => {
    window.clearInterval(timer.current)
    setRecording(false)
    recorder.current?.stop()
    recorder.current = null
  }

  const retake = () => {
    if (shotUrl.current) URL.revokeObjectURL(shotUrl.current)
    shotUrl.current = ''
    setShot(null)
    setSeconds(0)
  }

  const use = () => {
    if (!shot) return
    onCapture(shot.blob, shot.kind)
    onClose()
  }

  const flip = () => {
    // Dip before the swap, not after it: the new camera takes a moment to come
    // up, and a dip that starts here covers the whole of it.
    setSwitching(true)
    setFacing((side) => (side === 'environment' ? 'user' : 'environment'))
  }
  const flipLocked = recording && !CAN_FLIP_MID_TAKE

  const title = shot
    ? shot.kind === 'video'
      ? 'Review your video'
      : 'Review your photo'
    : recording
      ? `Recording… ${clock(seconds)}`
      : kind === 'video'
        ? 'Record a video'
        : kind === 'image'
          ? 'Take a photo'
          : 'Camera'

  return (
    <div
      className="shade-in fixed inset-0 z-[80] flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top,0px))] text-white lg:px-6">
        <p className="text-sm font-semibold" aria-live="polite">
          {title}
        </p>
        <div className="flex items-center gap-1">
          {canFlip && !error && !shot && (
            <button
              type="button"
              onClick={flip}
              disabled={flipLocked}
              aria-label={facing === 'environment' ? 'Switch to front camera' : 'Switch to back camera'}
              title="Switch camera"
              className="rounded-lg p-2 transition-colors hover:bg-white/10 disabled:opacity-30"
            >
              <SwitchCamera size={22} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close camera"
            className="rounded-lg p-2 transition-colors hover:bg-white/10"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      <div className="relative mx-auto flex w-full max-w-5xl flex-1 items-center justify-center overflow-hidden">
        {error ? (
          <p className="max-w-xs px-6 text-center text-sm text-white/80">{error}</p>
        ) : (
          <>
            <video
              ref={preview}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-contain transition-opacity duration-200 ${
                switching ? 'opacity-0' : 'opacity-100'
              } ${facing === 'user' ? '-scale-x-100' : ''} ${shot ? 'invisible' : ''}`}
            />

            {/* The review sits over the live picture so retaking is instant —
                the camera never had to be torn down. */}
            {shot && (
              <div className="shade-in absolute inset-0 flex items-center justify-center bg-black">
                {shot.kind === 'video' ? (
                  <video src={shot.url} controls autoPlay loop className="h-full w-full object-contain">
                    <track kind="captions" />
                  </video>
                ) : (
                  <img src={shot.url} alt="What you just took" className="h-full w-full object-contain" />
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="mx-auto flex w-full max-w-5xl items-center justify-center gap-3 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] pt-4 lg:gap-5 lg:pb-8">
        {error ? null : shot ? (
          <>
            <button
              type="button"
              onClick={retake}
              className="btn rounded-full border border-white/40 px-5 py-3 text-white transition-colors hover:bg-white/10"
            >
              <RotateCcw size={17} />
              Retake
            </button>
            <button
              type="button"
              onClick={use}
              className="btn rounded-full bg-teal px-6 py-3 text-white transition-transform hover:bg-teal/90 active:scale-95"
            >
              {shot.kind === 'video' ? 'Use Video' : 'Use Photo'}
            </button>
          </>
        ) : (
          <>
            {/* Photo and video share the screen unless the caller asked for one
                of them, so a shot never needs the menu re-opened to change. */}
            {kind !== 'video' && !recording && (
              <button
                type="button"
                onClick={shoot}
                aria-label="Take the photo"
                className="h-16 w-16 rounded-full bg-white ring-4 ring-white/40 transition-transform active:scale-95"
              />
            )}

            {kind !== 'image' && (
              <button
                type="button"
                onClick={recording ? stopRecording : startRecording}
                aria-label={recording ? 'Stop recording' : 'Start recording'}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 ring-4 ring-white/70 transition-transform active:scale-95"
              >
                {recording ? (
                  <Square size={26} className="text-sale" fill="currentColor" />
                ) : (
                  <Circle size={44} className="text-sale" fill="currentColor" />
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
