import { Star } from 'lucide-react'

/**
 * Display-only 1–5 star rating. Review submission comes later.
 */
export function StarRating({
  rating,
  reviewCount,
  size = 14,
  showCount = true,
  tone = 'default',
  className = '',
}: {
  rating: number
  reviewCount?: number
  size?: number
  showCount?: boolean
  /** `light` is for the deep navy store band. */
  tone?: 'default' | 'light'
  className?: string
}) {
  const rounded = Math.round(rating * 2) / 2
  const light = tone === 'light'

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs ${
        light ? 'text-white/75' : 'text-muted'
      } ${className}`}
      aria-label={`Rated ${rating.toFixed(1)} out of 5${
        reviewCount ? ` from ${reviewCount} reviews` : ''
      }`}
    >
      <span className="flex items-center gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((position) => {
          const filled = rounded >= position
          const half = !filled && rounded >= position - 0.5
          return (
            <span key={position} className="relative inline-block" style={{ width: size, height: size }}>
              <Star
                size={size}
                className={`absolute inset-0 ${light ? 'text-white/30' : 'text-line'}`}
                fill="currentColor"
              />
              {(filled || half) && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: half ? size / 2 : size }}
                >
                  <Star size={size} className="text-star" fill="currentColor" />
                </span>
              )}
            </span>
          )
        })}
      </span>
      <span className={`font-medium ${light ? 'text-white' : 'text-ink'}`}>
        {rating.toFixed(1)}
      </span>
      {showCount && reviewCount !== undefined && <span>({reviewCount})</span>}
    </span>
  )
}
