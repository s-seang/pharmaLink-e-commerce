import markSrc from '../assets/logo.png'
import fullSrc from '../assets/footerLogo.png'
import fullLightSrc from '../assets/footerLogoLight.png'

/**
 * The PharmaLink artwork, in its two official lockups:
 *
 *   - `mark` — the linked-P monogram on its own. Used wherever the name is
 *     already spelled out next to it (header, auth modal).
 *   - `full` — the monogram stacked over the "PharmaLink" wordmark. Used where
 *     the logo has to carry the brand by itself.
 *   - `fullLight` — the same lockup with the white paper knocked out, for dark
 *     grounds like the footer. Its art is still dark, so callers paint it with
 *     a filter rather than relying on its own colours.
 *
 * `mark` and `full` are opaque PNGs with a white background and need a light
 * surface behind them.
 *
 * Intrinsic sizes are baked in so the browser reserves the right box before the
 * image decodes; callers only ever set `height`.
 */
const ART = {
  mark: { src: markSrc, width: 340, height: 327 },
  full: { src: fullSrc, width: 531, height: 397 },
  fullLight: { src: fullLightSrc, width: 531, height: 397 },
} as const

export function Logo({
  variant = 'mark',
  height = 36,
  className = '',
}: {
  variant?: keyof typeof ART
  height?: number
  className?: string
}) {
  const art = ART[variant]

  return (
    <img
      src={art.src}
      alt="PharmaLink"
      width={Math.round((height * art.width) / art.height)}
      height={height}
      style={{ height }}
      className={`w-auto object-contain ${className}`}
      draggable={false}
    />
  )
}
