import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  KeyRound,
  LogOut,
  MapPin,
  Phone,
  UserRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { AuthForm } from '../components/AuthForm'
import { Logo } from '../components/Logo'
import { Layout } from '../components/Layout'
import { useApp } from '../context/AppContext'

/**
 * The profile, in the shape the rest of the app's shelves use: a coloured band
 * behind a card that the avatar sits across, the person's own details under
 * their name, then the account rows and the standing links as two groups.
 */
export default function Account() {
  const { user, address, orders, logout } = useApp()

  const email = user?.contact.includes('@') ? user.contact : undefined
  const phone = user && !email ? user.contact : address.phone

  return (
    <Layout header="none" floatingCart={false}>
      <header className="bg-navy pb-20 pt-4">
        <div className="app-container flex items-center gap-2">
          <Link
            to="/"
            aria-label="Back to home"
            className="-ml-1.5 rounded-lg p-1.5 text-white/90 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ChevronLeft size={22} />
          </Link>
          <h1 className="text-lg font-bold text-white">{user ? 'Profile' : 'Your account'}</h1>
        </div>
      </header>

      {!user && (
        <div className="app-container min-h-screen max-w-md pb-10">
          <section className="card -mt-14 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Logo height={32} />
              <div>
                <p className="text-sm font-semibold text-ink">PharmaLink</p>
                <p className="text-xs text-muted">Healthcare Connections</p>
              </div>
            </div>
            <AuthForm />
          </section>
        </div>
      )}

      {user && (
      <div className="app-container min-h-screen max-w-md space-y-3 pb-10">
        <section className="card -mt-14 px-4 pb-4 pt-0 text-center">
          <span className="mx-auto -mt-10 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-navy-tint text-navy shadow-sm">
            <UserRound size={34} />
          </span>

          <h2 className="mt-2 text-base font-bold text-ink">{user?.name}</h2>
          <p className="mt-0.5 text-xs text-muted">{phone}</p>
          {email && <p className="text-xs text-muted">{email}</p>}

          <ul className="mt-4 divide-y divide-line border-t border-line text-left">
              <Row icon={UserRound} label="My Account" value={user.name} />
              <Row icon={Phone} label="Phone Number" value={phone} />
              <Row icon={MapPin} label="Delivery Address" value={address.line1} />
              <Row icon={KeyRound} label="Change Password" />
              <Row
                icon={ClipboardList}
                label="Your Orders"
                value={`${orders.length} placed`}
                to="/orders"
              />
          </ul>
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

/** One account detail. Becomes a link only where there is somewhere to go. */
function Row({
  icon: Icon,
  label,
  value,
  to,
}: {
  icon: typeof UserRound
  label: string
  value?: string
  to?: string
}) {
  const body = (
    <>
      <Icon size={17} className="shrink-0 text-navy" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {value && <span className="block truncate text-xs text-muted">{value}</span>}
      </span>
      {to && <ChevronRight size={16} className="shrink-0 text-muted" />}
    </>
  )

  return (
    <li>
      {to ? (
        <Link to={to} className="flex items-center gap-3 py-3 transition-colors hover:text-navy">
          {body}
        </Link>
      ) : (
        <div className="flex items-center gap-3 py-3">{body}</div>
      )}
    </li>
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
