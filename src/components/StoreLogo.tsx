import type { Store } from '../data'

/** Circular store mark — initials on the store's brand colour. */
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
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-line font-semibold text-white ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: store.logoColor,
        fontSize: Math.round(size * 0.34),
      }}
      aria-hidden="true"
    >
      {store.initials}
    </span>
  )
}
