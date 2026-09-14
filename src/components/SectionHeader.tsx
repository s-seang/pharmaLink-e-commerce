import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function SectionHeader({
  title,
  viewAllTo,
  viewAllLabel,
  subtitle,
}: {
  title: string
  /** Renders a chevron that links through to the full list. */
  viewAllTo?: string
  viewAllLabel?: string
  subtitle?: string
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
      {viewAllTo && (
        <Link
          to={viewAllTo}
          aria-label={viewAllLabel ?? `View all — ${title}`}
          title={viewAllLabel ?? `View all — ${title}`}
          className="shrink-0 rounded-full p-1.5 text-navy transition-colors hover:bg-navy-tint"
        >
          <ChevronRight size={22} />
        </Link>
      )}
    </div>
  )
}
