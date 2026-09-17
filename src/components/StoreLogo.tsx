import type { Store } from '../data'

/**
 * A store's badge: its own logo where there is one, its initials otherwise.
 *
 * Every badge is the same circle at the same size, and the artwork is fitted
 * inside rather than cropped to fill — these are wordmarks, and a cover crop
 * would cut the name in half. The circle takes the colour sampled from the
 * artwork, so a logo on a dark ground keeps it instead of sitting in a white
 * square.
 */
export function StoreLogo({
  store,
  size = 56,
  className = '',
}: {
  store: Store
  size?: number
  className?: string
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line font-semibold text-white ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: store.logoColor,
        fontSize: Math.round(size * 0.34),
      }}
      aria-hidden="true"
    >
      {store.logo ? (
        <img
          src={store.logo}
          alt=""
          className="h-full w-full object-contain"
          style={{ padding: Math.round(size * 0.12) }}
        />
      ) : (
        store.initials
      )}
    </span>
  )
}
