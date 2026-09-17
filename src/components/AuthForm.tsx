import { Eye, EyeOff } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useApp, type AuthTab } from '../context/AppContext'

/**
 * Logging in and signing up.
 *
 * Controlled from outside so the screen around it can title itself — the two
 * are one flow with one heading, not a form with a tab strip on top.
 */
/**
 * Browsers put their own password-manager bubbles over a form that asks for a
 * new password, which lands on top of the button underneath. The fields opt
 * out of autofill so nothing covers the screen.
 */
export function AuthForm({
  tab,
  onTab,
  onDone,
}: {
  tab: AuthTab
  onTab: (tab: AuthTab) => void
  onDone?: () => void
}) {
  const { login } = useApp()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [contact, setContact] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const isSignup = tab === 'signup'

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!contact.trim() || !password) {
      setError('Enter your email and a password.')
      return
    }
    if (isSignup && password !== confirm) {
      setError('The two passwords do not match.')
      return
    }
    login(contact, isSignup ? `${firstName} ${lastName}`.trim() : undefined, phone)
    onDone?.()
  }

  const swap = (next: AuthTab) => {
    onTab(next)
    setError('')
  }

  return (
    <>
      <form onSubmit={submit} className="space-y-4">
        {isSignup && (
          <div className="flex gap-3">
            <Field label="First Name" className="flex-1">
              <input
                className="pill-input"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="First Name"
                autoComplete="off"
              />
            </Field>
            <Field label="Last Name" className="flex-1">
              <input
                className="pill-input"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Last Name"
                autoComplete="off"
              />
            </Field>
          </div>
        )}

        <Field label="Email Address">
          <input
            className="pill-input"
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            placeholder="Enter Email Address"
            autoComplete="off"
          />
        </Field>

        {isSignup && (
          <Field label="Phone Number">
            <input
              className="pill-input"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Enter Your Phone Number"
              inputMode="tel"
              autoComplete="off"
            />
          </Field>
        )}

        <Field label="Password">
          <div className="relative">
            <input
              className="pill-input pr-12"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter Your Password"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </Field>

        {isSignup && (
          <Field label="Confirm Password">
            <input
              className="pill-input"
              type={showPassword ? 'text' : 'password'}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              placeholder="Enter Your Confirm Password"
              autoComplete="off"
            />
          </Field>
        )}

        {!isSignup && (
          <div className="flex justify-end">
            <button type="button" className="text-xs font-semibold text-navy hover:underline">
              Forget Password?
            </button>
          </div>
        )}

        {error && <p className="text-xs font-medium text-sale">{error}</p>}

        <button
          type="submit"
          className="w-full rounded-full bg-navy-deep py-4 text-sm font-bold text-white transition-colors hover:bg-navy"
        >
          {isSignup ? 'Sign Up' : 'Sign In'}
        </button>
      </form>

      {isSignup ? (
        <p className="mt-5 text-xs leading-relaxed text-muted">
          By signing up, you agree to the{' '}
          <Link to="/policy/terms" className="font-semibold text-navy hover:underline">
            Terms Of Use
          </Link>{' '}
          and{' '}
          <Link to="/policy/privacy" className="font-semibold text-navy hover:underline">
            Privacy Notice
          </Link>
          .
        </p>
      ) : (
        <>
          <div className="my-5 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" />
            Or
            <span className="h-px flex-1 bg-line" />
          </div>

          <div className="flex gap-3">
            <SocialButton label="Google" onClick={() => login('google.user@gmail.com')}>
              <GoogleMark />
            </SocialButton>
            <SocialButton label="Facebook" onClick={() => login('facebook.user@mail.com')}>
              <FacebookMark />
            </SocialButton>
          </div>
        </>
      )}

      <p className="mt-6 text-center text-xs text-muted">
        {isSignup ? 'Already Have An Account? ' : "Don't Have An Account? "}
        <button
          type="button"
          className="font-bold text-navy hover:underline"
          onClick={() => swap(isSignup ? 'login' : 'signup')}
        >
          {isSignup ? 'Sign In' : 'Sign Up'}
        </button>
      </p>
    </>
  )
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold text-ink">{label}</span>
      {children}
    </label>
  )
}

function SocialButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-white py-3 text-sm font-semibold text-ink shadow-sm transition-colors hover:border-navy"
    >
      {children}
      {label}
    </button>
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
        d="M10.4 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.8-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.7l7.8-6.1Z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.7-3.8-13.6-9.1l-7.8 6.1C6.5 42.6 14.6 48 24 48Z"
      />
    </svg>
  )
}

function FacebookMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="#1877F2">
      <path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.6.2 2.6.2v2.9h-1.5c-1.5 0-1.9.9-1.9 1.8V12h3.3l-.5 3.5h-2.8v8.4A12 12 0 0 0 24 12Z" />
    </svg>
  )
}
