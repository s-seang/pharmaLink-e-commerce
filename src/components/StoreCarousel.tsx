import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { stores } from '../data'
import { useAutoScroll } from '../hooks/useAutoScroll'
import { StoreLogo } from './StoreLogo'

/**
 * Continuously scrolling store rail. The list is rendered twice and the
 * scroll offset rewinds by half the width, so it loops with no visible seam
 * and takes any number of stores.
 */
export function StoreCarousel() {
  const railRef = useRef<HTMLDivElement>(null)
  useAutoScroll(railRef, { speed: 28 })

  const loop = [...stores, ...stores]

  return (
    <div ref={railRef} className="no-scrollbar flex gap-5 overflow-x-auto pb-1">
      {loop.map((store, index) => (
        <Link
          key={`${store.id}-${index}`}
          to={`/store/${store.id}`}
          aria-hidden={index >= stores.length}
          tabIndex={index >= stores.length ? -1 : undefined}
          className="flex w-20 shrink-0 flex-col items-center gap-2 text-center"
        >
          <StoreLogo store={store} size={64} />
          <span className="line-clamp-2 text-xs font-medium leading-tight text-ink">
            {store.name}
          </span>
        </Link>
      ))}
    </div>
  )
}
