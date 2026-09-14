import { UserRound } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useApp } from '../context/AppContext'

/** Stubbed for now — built out once login is wired to a real backend. */
export default function Account() {
  const { user, logout, openAuth } = useApp()

  return (
    <Layout>
      <div className="app-container flex flex-col items-center gap-4 py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-navy-tint text-navy">
          <UserRound size={30} />
        </span>
        <div>
          <h1 className="text-lg font-semibold text-ink">
            {user ? user.name : 'Your account'}
          </h1>
          <p className="mt-1 text-sm text-muted">Coming soon.</p>
        </div>

        {user ? (
          <button type="button" onClick={logout} className="btn-outline">
            Log out
          </button>
        ) : (
          <button type="button" onClick={() => openAuth('login')} className="btn-primary">
            Log in
          </button>
        )}
      </div>
    </Layout>
  )
}
