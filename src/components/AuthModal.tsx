import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useApp, type AuthTab } from '../context/AppContext'
import { AuthForm } from './AuthForm'
import { Logo } from './Logo'

/**
 * The in-flow prompt: shown when something needs an account before it can go
 * ahead, like placing an order. Reaching it deliberately — tapping Profile —
 * lands on the account page's own version of this form instead.
 */
export function AuthModal() {
  const { authModal } = useApp()

  // Remounting on the requested tab resets the form and picks that tab up,
  // without an effect to keep the two in step.
  if (!authModal) return null
  return <AuthDialog key={authModal} initialTab={authModal} />
}

function AuthDialog({ initialTab }: { initialTab: AuthTab }) {
  const { closeAuth } = useApp()
  const [tab, setTab] = useState<AuthTab>(initialTab)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAuth()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [closeAuth])

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={tab === 'signup' ? 'Sign up' : 'Log in'}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeAuth()
      }}
    >
      <div className="sheet-panel max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-t-2xl bg-white p-5 shadow-lg sm:rounded-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <Logo height={32} />
            <div>
              <p className="text-xs text-muted">
                {tab === 'signup' ? 'Create Your Account' : 'Welcome Back!'}
              </p>
              <p className="text-xl font-extrabold leading-tight text-ink">
                {tab === 'signup' ? 'Sign Up' : 'Sign In'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeAuth}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-ink"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <AuthForm tab={tab} onTab={setTab} onDone={closeAuth} />
      </div>
    </div>
  )
}
