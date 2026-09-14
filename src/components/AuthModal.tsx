import { Eye, EyeOff, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useApp, type AuthTab } from '../context/AppContext'
import { Logo } from './Logo'

/** Login and sign-up live in this modal only — there is no separate page. */
export function AuthModal() {
  const { authModal } = useApp()

  // Remounting on `authModal` resets the form and picks up the requested tab.
  if (!authModal) return null
  return <AuthDialog key={authModal} initialTab={authModal} />
}

function AuthDialog({ initialTab }: { initialTab: AuthTab }) {
  const { closeAuth, openAuth, login } = useApp()
  const [tab, setTab] = useState<AuthTab>(initialTab)
  const [contact, setContact] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

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

  const isSignup = tab === 'signup'

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!contact.trim() || !password) {
      setError('Enter your phone or email and a password.')
      return
    }
    if (isSignup && password !== confirm) {
      setError('The two passwords do not match.')
      return
    }
    login(contact, isSignup ? fullName : undefined)
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isSignup ? 'Sign up' : 'Log in'}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeAuth()
      }}
    >
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-lg sm:rounded-2xl">
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

        <div className="mb-5 grid grid-cols-2 rounded-lg bg-surface p-1">
          {(['login', 'signup'] as AuthTab[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setTab(value)
                setError('')
              }}
              className={`rounded-md py-2 text-sm font-semibold transition-colors ${
                tab === value ? 'bg-white text-navy shadow-sm' : 'text-muted'
              }`}
              aria-pressed={tab === value}
            >
              {value === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          {isSignup && (
            <Field label="Full name">
              <input
                className="input"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Sok Chanthy"
                autoComplete="name"
              />
            </Field>
          )}

          <Field label="Phone or email">
            <input
              className="input"
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              placeholder="012 345 678 or you@email.com"
              autoComplete="username"
            />
          </Field>

          <Field label="Password">
            <div className="relative">
              <input
                className="input pr-10"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted hover:text-ink"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>

          {isSignup && (
            <Field label="Confirm password">
              <input
                className="input"
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </Field>
          )}

          {!isSignup && (
            <div className="flex justify-end">
              <button type="button" className="text-xs font-medium text-navy hover:underline">
                Forgot password?
              </button>
            </div>
          )}

          {error && <p className="text-xs font-medium text-sale">{error}</p>}

          <button type="submit" className="btn-primary w-full">
            {isSignup ? 'Create account' : 'Log in'}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-line" />
          or
          <span className="h-px flex-1 bg-line" />
        </div>

        <button
          type="button"
          onClick={() => login(contact || 'google.user@gmail.com', fullName || undefined)}
          className="btn-outline w-full"
        >
          <GoogleMark />
          Continue with Google
        </button>

        <p className="mt-4 text-center text-xs text-muted">
          {isSignup ? 'Already have an account? ' : 'New to PharmaLink? '}
          <button
            type="button"
            className="font-semibold text-navy hover:underline"
            onClick={() => openAuth(isSignup ? 'login' : 'signup')}
          >
            {isSignup ? 'Log in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  )
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.3 17.7 9.5 24 9.5Z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17.3Z"
      />
      <path
        fill="#FBBC05"
        d="M10.4 28.7a14.5 14.5 0 0 1 0-9.4l-7.8-6.1a24 24 0 0 0 0 21.6l7.8-6.1Z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.2 0 11.5-2 15.4-5.5l-7.5-5.8c-2.1 1.4-4.8 2.3-7.9 2.3-6.3 0-11.7-3.8-13.6-9.3l-7.8 6.1C6.5 42.6 14.6 48 24 48Z"
      />
    </svg>
  )
}
