import { Search, ShoppingCart, User } from 'lucide-react'
import { useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useCartEntry } from '../hooks/useCartEntry'
import { stockedCategories, STORE_FILTERS } from '../data'
import { useHideOnScroll } from '../hooks/useHideOnScroll'
import { Logo } from './Logo'

/**
 * The header is two independent fixed bars, not one box that grows and shrinks:
 *
 *   - LogoBar    — logo, "Welcome", account. Slides up out of view on scroll.
 *   - SearchBar  — search and cart. Always on screen, and rides up to the top of
 *                  the viewport as the logo bar leaves.
 *
 * The filter chips are deliberately not part of either one. They sit in normal
 * flow underneath, so they scroll away with the page like ordinary content.
 *
 * Both are moved by the same transform, so they travel together, and neither
 * ever changes size. A spacer holds their combined height open in normal flow.
 * That last part matters: the previous version collapsed the logo row's height,
 * which made the browser's scroll anchoring rewrite the scroll position to
 * compensate, which fired a scroll event the other way, which showed the row
 * again — a permanent flicker. Transform-only motion cannot do that.
 */
export function Header() {
  const rowVisible = useHideOnScroll()

  const logoBarRef = useRef<HTMLDivElement>(null)
  const searchBarRef = useRef<HTMLDivElement>(null)
  const [heights, setHeights] = useState({ logoBar: 0, searchBar: 0 })

  useLayoutEffect(() => {
    const logoBar = logoBarRef.current
    const searchBar = searchBarRef.current
    if (!logoBar || !searchBar) return

    // `offsetHeight` ignores transforms, so these stay at their expanded values
    // whether the logo bar is currently on screen or not. The observer only
    // refires for changes that are real — viewport width, rotation, the cursive
    // font finishing loading — never for the show/hide toggle.
    const measure = () => {
      setHeights((current) =>
        current.logoBar === logoBar.offsetHeight && current.searchBar === searchBar.offsetHeight
          ? current
          : { logoBar: logoBar.offsetHeight, searchBar: searchBar.offsetHeight },
      )
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(logoBar)
    observer.observe(searchBar)
    return () => observer.disconnect()
  }, [])

  const shift = rowVisible ? 0 : heights.logoBar

  return (
    <>
      {/* Reserves both bars' height in flow. Independent of `rowVisible`, so
          nothing below the header ever moves. */}
      <div aria-hidden="true" style={{ height: heights.logoBar + heights.searchBar }} />

      <div
        ref={logoBarRef}
        style={{ transform: `translateY(-${shift}px)`, opacity: rowVisible ? 1 : 0 }}
        className="fixed inset-x-0 top-0 z-30 bg-white transition-[transform,opacity] duration-200 ease-out will-change-transform motion-reduce:transition-none"
      >
        <LogoBar />
      </div>

      <div
        ref={searchBarRef}
        style={{ top: heights.logoBar, transform: `translateY(-${shift}px)` }}
        className="fixed inset-x-0 z-40 border-b border-line bg-white transition-transform duration-200 ease-out will-change-transform motion-reduce:transition-none"
      >
        <SearchBar />
      </div>

      <Filters />
    </>
  )
}

function LogoBar() {
  const { user } = useApp()

  return (
    <div className="app-container flex items-center justify-between gap-3 py-2.5">
      <Link to="/" className="flex items-center gap-2" aria-label="PharmaLink home">
        <Logo height={36} />
        <span className="font-script text-[25px] leading-none text-navy sm:text-[28px]">
          Welcome
        </span>
      </Link>

      {user ? (
        <Link
          to="/account"
          className="flex items-center gap-1.5 rounded-lg px-1.5 py-2 text-navy-deep transition-colors hover:bg-navy-tint"
        >
          <User size={22} />
          <span className="max-w-[9rem] truncate text-sm font-semibold">{user.name}</span>
        </Link>
      ) : (
        <Link
          to="/account"
          className="flex items-center gap-1.5 rounded-lg px-1.5 py-2 text-navy-deep transition-colors hover:bg-navy-tint"
        >
          <User size={22} />
          <span className="text-sm font-semibold">Log in</span>
        </Link>
      )}
    </div>
  )
}

function SearchBar() {
  const navigate = useNavigate()
  const { cartCount } = useApp()
  const openTheCart = useCartEntry()
  const [query, setQuery] = useState('')

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    const q = query.trim()
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
  }

  return (
    <div className="app-container flex items-center gap-2 py-2">
      <form
        onSubmit={submitSearch}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 focus-within:border-navy"
        role="search"
      >
        <button type="submit" aria-label="Search" className="shrink-0 text-navy">
          <Search size={18} />
        </button>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search medicine, skincare, supplements"
          aria-label="Search products"
          className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
        />
      </form>

      <button
        type="button"
        onClick={openTheCart}
        className="relative shrink-0 rounded-lg p-2 text-navy-deep transition-colors hover:bg-navy-tint"
        aria-label={`Cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
      >
        <ShoppingCart size={22} />
        {cartCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-semibold text-white">
            {cartCount > 99 ? '99+' : cartCount}
          </span>
        )}
      </button>
    </div>
  )
}

/** Category chips, in normal flow so they scroll away with the page. */
function Filters() {
  const navigate = useNavigate()

  return (
    <div className="app-container border-b border-line pb-3 pt-1">
      <FilterRow label="Filter by store:">
        {STORE_FILTERS.map((type) => (
          <button
            key={type}
            type="button"
            className="chip"
            onClick={() => navigate(`/stores?type=${encodeURIComponent(type)}`)}
          >
            {type}
          </button>
        ))}
      </FilterRow>

      <FilterRow label="Filter by product:">
        {stockedCategories.map((category) => (
          <button
            key={category}
            type="button"
            className="chip"
            onClick={() => navigate(`/search?category=${encodeURIComponent(category)}`)}
          >
            {category}
          </button>
        ))}
      </FilterRow>
    </div>
  )
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="no-scrollbar mt-2 flex items-center gap-2 overflow-x-auto">
      <span className="shrink-0 text-xs font-semibold text-muted">{label}</span>
      {children}
    </div>
  )
}
