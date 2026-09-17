import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { AuthForm } from './AuthForm'
import { Logo } from './Logo'

/**
 * The in-flow prompt: shown when something needs an account before it can go
 * ahead, like placing an order. Reaching it deliberately — tapping Profile —
 * lands on the account page's own version of this form instead.
 */
export function AuthModal() {
  const { authModal, closeAuth } = useApp()

  useEffect(() => {
    if (!authModal) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAuth()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [authModal, closeAuth])

  if (!authModal) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={authModal === 'signup' ? 'Sign up' : 'Log in'}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeAuth()
      }}
    >
      <div className="sheet-panel max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-t-2xl bg-white p-5 shadow-lg sm:rounded-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Logo height={32} />
            <div>
              <p className="text-sm font-semibold text-ink">PharmaLink</p>
              <p className="text-xs text-muted">Healthcare Connections</p>
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

        <AuthForm key={authModal} initialTab={authModal} onDone={closeAuth} />
      </div>
    </div>
  )
}
