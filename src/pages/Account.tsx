import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Heart,
  KeyRound,
  LogOut,
  MapPin,
  ShoppingCart,
  Ticket,
  UserRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { AuthForm } from '../components/AuthForm'
import { Layout } from '../components/Layout'
import { useApp, type AuthTab } from '../context/AppContext'

/**
 * The profile, in the shape the rest of the app's shelves use: a coloured band
 * behind a card that the avatar sits across, the person's own details under
 * their name, then the account rows and the standing links as two groups.
 */
export default function Account() {
  const { user, address, orders, favourites, carts, logout } = useApp()
  const [tab, setTab] = useState<AuthTab>('login')

  const email = user?.contact.includes('@') ? user.contact : undefined
  const phone = user?.phone ?? (user && !email ? user.contact : address.phone)

  return (
    <Layout header="none" floatingCart={false}>
      {user ? (
        /* The same block the sign-in screen wears, with the account in it. */
        <header className="rounded-br-[3.5rem] bg-navy-deep pb-8 pt-4">
          <div className="app-container max-w-md">
            <div className="flex items-center gap-2">
              <Link
                to="/"
                aria-label="Back to home"
                className="-ml-1.5 rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <ChevronLeft size={22} />
              </Link>
              <h1 className="text-sm font-semibold text-white/80">Profile</h1>
            </div>

            <div className="mt-5 flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/15 text-lg font-bold text-white ring-2 ring-white/30">
                {initialsOf(user.name) || <UserRound size={30} />}
              </span>

              <div className="min-w-0">
                <p className="truncate text-2xl font-extrabold tracking-tight text-white">
                  {user.name}
                </p>
                <p className="truncate text-sm text-white/75">{phone}</p>
                {email && <p className="truncate text-xs text-white/60">{email}</p>}
              </div>
            </div>
          </div>
        </header>
      ) : (
        /* The curve is the whole welcome: a deep block the form sits under. */
        <header className="rounded-br-[3.5rem] bg-navy-deep px-1 pb-12 pt-4">
          <div className="app-container max-w-md">
            <div className="flex items-start justify-between gap-3">
              <Link
                to="/"
                aria-label="Back to home"
                className="-ml-1.5 rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <ChevronLeft size={22} />
              </Link>

              <Link to="/" className="text-sm font-semibold text-white/80 hover:text-white">
                Skip
              </Link>
            </div>

            <p className="mt-6 text-sm text-white/70">
              {tab === 'signup' ? 'Create Your Account' : 'Welcome Back!'}
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight text-white">
              {tab === 'signup' ? 'Sign Up' : 'Sign In'}
            </h1>
          </div>
        </header>
      )}

      {!user && (
        <div className="app-container min-h-screen max-w-md py-8">
          <AuthForm tab={tab} onTab={setTab} />
        </div>
      )}

      {user && (
      <div className="app-container min-h-screen max-w-md space-y-3 py-6">
        {/* The four things people come here to open. */}
        <div className="grid grid-cols-2 gap-3">
          <Tile icon={ClipboardList} label="Order history" to="/orders" note={`${orders.length} placed`} />
          <Tile icon={Heart} label="Favourites" to="/favourites" note={`${favourites.length} saved`} />
          <Tile icon={Ticket} label="Vouchers" to="/discounts" note="Offers on now" />
          <Tile icon={ShoppingCart} label="Your carts" to="/carts" note={`${carts.length} open`} />
        </div>

        <section className="card divide-y divide-line">
          <Row icon={MapPin} label="Delivery address" value={address.line1} />
          <Row icon={KeyRound} label="Change password" value="Last changed — never" />
        </section>

        <section className="card divide-y divide-line">
          <LinkRow to="/about" label="About Us" />
          <LinkRow to="/policy/terms" label="Terms of Service" />
          <LinkRow to="/policy/privacy" label="Privacy Policy" />
          <LinkRow to="/policy/returns" label="Return and Refund" />
        </section>

        <button type="button" onClick={logout} className="btn-outline w-full">
          <LogOut size={18} />
          Log out
        </button>
      </div>
      )}
    </Layout>
  )
}

/** "Sok Chanthy" becomes "SC" — a stand-in until there is a photo to show. */
function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

/** One of the four squares: where it goes, and how much is waiting there. */
function Tile({
  icon: Icon,
  label,
  note,
  to,
}: {
  icon: typeof UserRound
  label: string
  note: string
  to: string
}) {
  return (
    <Link
      to={to}
      className="card flex flex-col items-center gap-1 px-3 py-5 text-center transition-colors hover:border-navy"
    >
      <Icon size={22} className="text-navy" />
      <span className="text-sm font-semibold text-ink">{label}</span>
      <span className="text-xs text-muted">{note}</span>
    </Link>
  )
}

/** A standing detail of the account, with nowhere else to go. */
function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound
  label: string
  value?: string
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <Icon size={17} className="shrink-0 text-navy" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {value && <span className="block truncate text-xs text-muted">{value}</span>}
      </span>
    </div>
  )
}

function LinkRow({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between gap-3 px-4 py-3.5 text-sm text-ink transition-colors hover:text-navy"
    >
      {label}
      <ChevronRight size={16} className="shrink-0 text-muted" />
    </Link>
  )
}
