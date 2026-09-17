import { useApp } from '../context/AppContext'
import { isOpenNow, type Store } from '../data'

export function OpenBadge({
  store,
  tone = 'default',
  className = '',
}: {
  store: Store
  /** `light` is for the deep navy store band. */
  tone?: 'default' | 'light'
  className?: string
}) {
  const { now } = useApp()
  const open = isOpenNow(store, now)
  const light = tone === 'light'

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
        light ? 'text-white/85' : open ? 'text-teal' : 'text-muted'
      } ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          open ? (light ? 'bg-teal-tint' : 'bg-teal') : light ? 'bg-white/50' : 'bg-muted'
        }`}
        aria-hidden="true"
      />
      {open ? 'Open now' : 'Closed'}
    </span>
  )
}
