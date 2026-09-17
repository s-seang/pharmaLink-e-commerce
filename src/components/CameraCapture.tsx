import { Circle, Square, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export type CaptureKind = 'image' | 'video'

/** "0:07" */
function clock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

/**
 * The device camera, live in the page.
 *
 * A file input with `capture` opens the camera app on a phone but only a file
 * picker everywhere else, so the shot is taken here instead: a preview stream,
 * a shutter that grabs a frame, and for video a recorder on the same stream.
 */
export function CameraCapture({
  kind,
  onCapture,
  onClose,
}: {
  kind: CaptureKind
  onCapture: (blob: Blob, kind: CaptureKind) => void
  onClose: () => void
}) {
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<BlobPart[]>([])
  const timer = useRef<number>(0)

  const [error, setError] = useState('')
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    let live = true

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'environment' }, audio: kind === 'video' })
      .then((media) => {
        if (!live) {
          media.getTracks().forEach((track) => track.stop())
          return
        }
        stream.current = media
        if (video.current) video.current.srcObject = media
      })
      .catch(() => {
        if (live) setError('PharmaLink needs permission to use your camera.')
      })

    return () => {
      live = false
      window.clearInterval(timer.current)
      if (recorder.current?.state === 'recording') recorder.current.stop()
      stream.current?.getTracks().forEach((track) => track.stop())
    }
  }, [kind])

  /** Grab the current frame off the preview. */
  const shoot = () => {
    const element = video.current
    if (!element) return

    const canvas = document.createElement('canvas')
    canvas.width = element.videoWidth
    canvas.height = element.videoHeight
    canvas.getContext('2d')?.drawImage(element, 0, 0)
    canvas.toBlob((blob) => {
      if (blob) onCapture(blob, 'image')
      onClose()
    }, 'image/jpeg', 0.9)
  }

  const startRecording = () => {
    if (!stream.current) return
    const media = new MediaRecorder(stream.current)
    chunks.current = []
    media.ondataavailable = (event) => chunks.current.push(event.data)
    media.onstop = () => {
      if (chunks.current.length > 0) {
        onCapture(new Blob(chunks.current, { type: media.mimeType }), 'video')
      }
      onClose()
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
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-label={kind === 'video' ? 'Record a video' : 'Take a photo'}
    >
      <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top,0px))] text-white">
        <p className="text-sm font-semibold" aria-live="polite">
          {recording ? `Recording… ${clock(seconds)}` : kind === 'video' ? 'Record a video' : 'Take a photo'}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close camera"
          className="rounded-lg p-2 transition-colors hover:bg-white/10"
        >
          <X size={22} />
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden">
        {error ? (
          <p className="max-w-xs px-6 text-center text-sm text-white/80">{error}</p>
        ) : (
          <video
            ref={video}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-contain"
          />
        )}
      </div>

      <div className="flex items-center justify-center pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] pt-4">
        {!error &&
          (kind === 'video' ? (
            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              aria-label={recording ? 'Stop recording' : 'Start recording'}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 ring-4 ring-white/70"
            >
              {recording ? (
                <Square size={26} className="text-sale" fill="currentColor" />
              ) : (
                <Circle size={44} className="text-sale" fill="currentColor" />
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={shoot}
              aria-label="Take the photo"
              className="h-16 w-16 rounded-full bg-white ring-4 ring-white/40 transition-transform active:scale-95"
            />
          ))}
      </div>
    </div>
  )
}
