import { useApp } from '../context/AppContext'
import { isOpenNow, nextOpening, type Store } from '../data'

export function OpenBadge({
  store,
  tone = 'default',
  detail = false,
  className = '',
}: {
  store: Store
  /** `light` is for the deep navy store band. */
  tone?: 'default' | 'light'
  /** Say when it opens again. Only where the row has room for the extra words. */
  detail?: boolean
  className?: string
}) {
  const { now } = useApp()
  const open = isOpenNow(store, now)
  const light = tone === 'light'
  const opensAt = nextOpening(store, now)

  const shutLabel = detail ? (opensAt ? `Closed until ${opensAt}` : 'Closed today') : 'Closed'

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
      {open ? 'Open now' : shutLabel}
    </span>
  )
}
