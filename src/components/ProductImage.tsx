import type { Category, Product } from '../data'

/**
 * Generated placeholder artwork, so the app has no external image dependency.
 * Each product gets a stable colourway from its seed and a glyph per category.
 */

const PALETTES = [
  { bg: '#EAF1F7', shape: '#2B5C8A', accent: '#4A9A96' },
  { bg: '#E4F0EF', shape: '#4A9A96', accent: '#1F4466' },
  { bg: '#F7F9FB', shape: '#1F4466', accent: '#4A9A96' },
  { bg: '#FDF1E9', shape: '#C2410C', accent: '#2B5C8A' },
]

function Glyph({ category, palette }: { category: Category; palette: (typeof PALETTES)[number] }) {
  const { shape, accent } = palette

  switch (category) {
    case 'Medicine':
      // Capsule on the diagonal.
      return (
        <g>
          <rect x="24" y="46" width="72" height="28" rx="14" fill={shape} transform="rotate(-30 60 60)" />
          <path
            d="M60 60 L88.9 43.3 A14 14 0 0 1 74.9 67.6 Z"
            fill={accent}
            transform="rotate(-30 60 60)"
          />
          <circle cx="86" cy="34" r="6" fill={accent} />
        </g>
      )
    case 'Cosmetic':
      // Pump bottle — the category covers skincare as well as make-up.
      return (
        <g>
          <rect x="44" y="46" width="32" height="44" rx="8" fill={shape} />
          <rect x="54" y="30" width="12" height="18" rx="4" fill={accent} />
          <rect x="50" y="58" width="20" height="4" rx="2" fill={palette.bg} />
          <rect x="50" y="68" width="14" height="4" rx="2" fill={palette.bg} />
        </g>
      )
    case 'Supplement':
      // Supplement tub.
      return (
        <g>
          <rect x="38" y="42" width="44" height="48" rx="9" fill={shape} />
          <rect x="42" y="32" width="36" height="12" rx="5" fill={accent} />
          <rect x="46" y="58" width="28" height="18" rx="4" fill={palette.bg} />
          <path d="M60 62v10M55 67h10" stroke={shape} strokeWidth="3" strokeLinecap="round" />
        </g>
      )
    case 'Medical Equipment':
      // Monitor showing a trace.
      return (
        <g>
          <rect x="30" y="38" width="60" height="44" rx="8" fill={shape} />
          <rect x="38" y="46" width="44" height="22" rx="4" fill={palette.bg} />
          <path
            d="M42 60h6l4-8 5 14 4-6h13"
            stroke={accent}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="42" cy="75" r="3.5" fill={accent} />
          <rect x="52" y="72" width="30" height="6" rx="3" fill={accent} />
        </g>
      )
  }
}

export function ProductImage({
  product,
  className = '',
  rounded = 'rounded-t-card',
}: {
  product: Product
  className?: string
  rounded?: string
}) {
  const palette = PALETTES[product.imageSeed % PALETTES.length]

  return (
    <div className={`overflow-hidden ${rounded} ${className}`} style={{ backgroundColor: palette.bg }}>
      <svg viewBox="0 0 120 120" className="h-full w-full" role="img" aria-label={product.name}>
        <circle cx="60" cy="60" r="42" fill="#FFFFFF" opacity="0.55" />
        <Glyph category={product.category} palette={palette} />
      </svg>
    </div>
  )
}
