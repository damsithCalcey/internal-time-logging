import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useLogin } from './useLogin'
import { useAuth } from './AuthProvider'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  keepSignedIn: z.boolean(),
})
type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isLoading } = useAuth()
  const from = (location.state as { from?: string } | null)?.from ?? '/app'

  const login = useLogin()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { keepSignedIn: true },
  })

  useEffect(() => {
    if (!isLoading && user) navigate(from, { replace: true })
  }, [isLoading, user, navigate, from])

  const onSubmit = (data: FormValues) => {
    login.mutate(
      { email: data.email, password: data.password },
      { onSuccess: () => navigate(from, { replace: true }) },
    )
  }

  const submitError = login.error
    ? (login.error as { message?: string }).message ?? 'Sign in failed. Check your credentials.'
    : null

  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center p-12">
      <div
        className="w-full max-w-[420px] bg-white rounded-[24px] border border-ink-200"
        style={{ padding: '44px 48px 40px', boxShadow: 'var(--shadow-md)' }}
      >
        {/* Brand */}
        <div className="flex items-center gap-[10px] mb-7">
          <div
            className="w-9 h-9 rounded-[10px] bg-tropical-magenta flex items-center justify-center"
            style={{ flexShrink: 0 }}
          >
            <span
              className="text-white font-display font-black leading-none"
              style={{ fontSize: 20, letterSpacing: '-0.04em' }}
            >
              c
            </span>
          </div>
          <span
            className="font-display font-extrabold"
            style={{ fontSize: 18, letterSpacing: '-0.02em' }}
          >
            Calcey Hours<span className="text-tropical-magenta">.</span>
          </span>
        </div>

        {/* Heading */}
        <div className="mb-7">
          <h2
            className="font-display font-extrabold text-ink-1000 m-0"
            style={{ fontSize: 28, lineHeight: 1.08, letterSpacing: '-0.02em' }}
          >
            Welcome back.
          </h2>
          <p className="mt-1.5 text-ink-600 leading-relaxed m-0" style={{ fontSize: 14 }}>
            Use your Calcey email. Accounts are provisioned by your manager.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          {/* Email */}
          <div>
            <label className="block font-display font-semibold text-ink-700 mb-1.5" style={{ fontSize: 12.5 }}>
              Work email
            </label>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@calcey.com"
              className="field-input w-full px-3 py-2.5 border border-ink-300 rounded-[10px] font-body text-ink-1000 bg-white"
              style={{ fontSize: 14 }}
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-red-600 text-xs">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <label className="font-display font-semibold text-ink-700" style={{ fontSize: 12.5 }}>
                Password
              </label>
              <button
                type="button"
                className="font-display font-semibold text-tropical-magenta"
                style={{ fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Forgot?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="field-input w-full px-3 py-2.5 border border-ink-300 rounded-[10px] font-body text-ink-1000 bg-white pr-10"
                style={{ fontSize: 14 }}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-red-600 text-xs">{errors.password.message}</p>
            )}
          </div>

          {/* Keep signed in */}
          <label className="flex items-center gap-2.5 mt-0.5 cursor-pointer" style={{ fontSize: 13 }}>
            <input type="checkbox" className="sr-only" {...register('keepSignedIn')} />
            <span
              className="w-[18px] h-[18px] rounded-[5px] bg-tropical-magenta flex items-center justify-center flex-shrink-0"
              style={{ border: '1.5px solid var(--tropical-magenta)' }}
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M2 5.5L4.5 8L9 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-ink-700">Keep me signed in on this device</span>
          </label>

          {/* Error */}
          {submitError && (
            <p
              className="text-red-600 text-sm rounded-[10px] bg-red-100 px-3 py-2.5"
              role="alert"
              aria-live="polite"
            >
              {submitError}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || login.isPending}
            className="mt-2 w-full flex items-center justify-center gap-2 font-display font-semibold text-white rounded-full disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            style={{
              padding: '14px 24px',
              fontSize: 15,
              background: 'var(--tropical-magenta)',
              boxShadow: 'var(--shadow-brand)',
            }}
            onMouseEnter={(e) => { if (!isSubmitting && !login.isPending) (e.currentTarget as HTMLButtonElement).style.background = 'var(--magenta-800)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--tropical-magenta)' }}
          >
            {login.isPending ? 'Signing in…' : 'Sign in'}
            {!login.isPending && <ArrowRight size={15} />}
          </button>
        </form>

        {/* Footer */}
        <div
          className="mt-7 pt-5 border-t border-ink-200 text-ink-500 text-center"
          style={{ fontSize: 12.5 }}
        >
          Stuck? Ping{' '}
          <span className="font-semibold text-ink-1000">#hours-help</span> on Slack.
        </div>
      </div>
    </div>
  )
}
