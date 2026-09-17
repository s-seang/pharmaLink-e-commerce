/**
 * The two-note chime that plays when an order lands.
 *
 * Synthesised rather than shipped as a file: it is half a second of two sine
 * notes, and an asset would be larger than the code that makes it. Silently
 * does nothing where audio is blocked — the receipt is the real confirmation.
 */
export function playOrderChime(): void {
  try {
    const Ctx = window.AudioContext
    if (!Ctx) return

    const ctx = new Ctx()
    const start = ctx.currentTime

    for (const [frequency, delay] of [
      [880, 0],
      [1318.5, 0.12],
    ] as const) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = frequency

      const at = start + delay
      gain.gain.setValueAtTime(0.0001, at)
      gain.gain.exponentialRampToValueAtTime(0.16, at + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.35)

      osc.connect(gain).connect(ctx.destination)
      osc.start(at)
      osc.stop(at + 0.4)
    }

    window.setTimeout(() => void ctx.close(), 900)
  } catch {
    // Autoplay policy or no audio device — nothing to recover from.
  }
}
