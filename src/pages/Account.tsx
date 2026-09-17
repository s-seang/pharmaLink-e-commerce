import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Heart,
  KeyRound,
  LogOut,
  MapPin,
  Plus,
  ShoppingCart,
  Smartphone,
  Ticket,
  UserRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { PaymentMethodSheet } from '../components/PaymentMethodSheet'
import { AuthForm } from '../components/AuthForm'
import { Layout } from '../components/Layout'
import { useApp, type AuthTab } from '../context/AppContext'

/**
 * The profile, in the shape the rest of the app's shelves use: a coloured band
 * behind a card that the avatar sits across, the person's own details under
 * their name, then the account rows and the standing links as two groups.
 */
export default function Account() {
  const { user, address, orders, favourites, carts, logout, savedPayment, forgetPayment } =
    useApp()
  const [tab, setTab] = useState<AuthTab>('login')
  const [addingPayment, setAddingPayment] = useState(false)

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
            <Link
              to="/"
              aria-label="Back to home"
              className="-ml-1.5 inline-flex rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft size={22} />
            </Link>

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

        {/* Saved so checkout can settle in one tap rather than a form. */}
        <section className="card p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-ink">Payment method</h2>
            {savedPayment && (
              <button
                type="button"
                onClick={forgetPayment}
                className="text-xs font-semibold text-muted transition-colors hover:text-sale"
              >
                Remove
              </button>
            )}
          </div>

          {savedPayment ? (
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-surface p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-navy">
                {savedPayment.kind === 'card' ? <CreditCard size={20} /> : <Smartphone size={20} />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">
                  {savedPayment.label}
                  {savedPayment.last4 ? ` ···· ${savedPayment.last4}` : ''}
                </span>
                <span className="block text-xs text-muted">
                  {savedPayment.expiry ? `Valid through ${savedPayment.expiry}` : 'Linked account'}
                  {' · pays in one tap'}
                </span>
              </span>
            </div>
          ) : (
            <>
              <p className="mt-1 text-xs text-muted">
                Save a card or link ABA and checkout settles without typing it again.
              </p>
              <button
                type="button"
                onClick={() => setAddingPayment(true)}
                className="btn-outline mt-3 w-full"
              >
                <Plus size={16} />
                Add a payment method
              </button>
            </>
          )}
        </section>

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

      {addingPayment && <PaymentMethodSheet onClose={() => setAddingPayment(false)} />}
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
