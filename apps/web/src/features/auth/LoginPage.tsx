import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from './AuthProvider'
import { useLogin } from './useLogin'

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
    ? ((login.error as { message?: string }).message ?? 'Sign in failed. Check your credentials.')
    : null

  return (
    <div className="bg-ink-50 flex min-h-screen items-center justify-center p-12">
      <div
        className="border-ink-200 w-full max-w-[420px] rounded-[24px] border bg-white"
        style={{ padding: '44px 48px 40px', boxShadow: 'var(--shadow-md)' }}
      >
        {/* Brand */}
        <div className="mb-7 flex items-center gap-[10px]">
          <div
            className="bg-tropical-magenta flex h-9 w-9 items-center justify-center rounded-[10px]"
            style={{ flexShrink: 0 }}
          >
            <span
              className="font-display leading-none font-black text-white"
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
            className="font-display text-ink-1000 m-0 font-extrabold"
            style={{ fontSize: 28, lineHeight: 1.08, letterSpacing: '-0.02em' }}
          >
            Welcome back.
          </h2>
          <p className="text-ink-600 m-0 mt-1.5 leading-relaxed" style={{ fontSize: 14 }}>
            Use your Calcey email. Accounts are provisioned by your manager.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          {/* Email */}
          <div>
            <label
              className="font-display text-ink-700 mb-1.5 block font-semibold"
              style={{ fontSize: 12.5 }}
            >
              Work email
            </label>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@calcey.com"
              className="field-input border-ink-300 font-body text-ink-1000 w-full rounded-[10px] border bg-white px-3 py-2.5"
              style={{ fontSize: 14 }}
              {...register('email')}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <label className="font-display text-ink-700 font-semibold" style={{ fontSize: 12.5 }}>
                Password
              </label>
              <button
                type="button"
                className="font-display text-tropical-magenta font-semibold"
                style={{
                  fontSize: 12,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Forgot?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="field-input border-ink-300 font-body text-ink-1000 w-full rounded-[10px] border bg-white px-3 py-2.5 pr-10"
                style={{ fontSize: 14 }}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-ink-500 absolute top-1/2 right-3 -translate-y-1/2"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Keep signed in */}
          <label
            className="mt-0.5 flex cursor-pointer items-center gap-2.5"
            style={{ fontSize: 13 }}
          >
            <input type="checkbox" className="sr-only" {...register('keepSignedIn')} />
            <span
              className="bg-tropical-magenta flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px]"
              style={{ border: '1.5px solid var(--tropical-magenta)' }}
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path
                  d="M2 5.5L4.5 8L9 3"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="text-ink-700">Keep me signed in on this device</span>
          </label>

          {/* Error */}
          {submitError && (
            <p
              className="rounded-[10px] bg-red-100 px-3 py-2.5 text-sm text-red-600"
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
            className="font-display mt-2 flex w-full items-center justify-center gap-2 rounded-full font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              padding: '14px 24px',
              fontSize: 15,
              background: 'var(--tropical-magenta)',
              boxShadow: 'var(--shadow-brand)',
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting && !login.isPending)
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--magenta-800)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--tropical-magenta)'
            }}
          >
            {login.isPending ? 'Signing in…' : 'Sign in'}
            {!login.isPending && <ArrowRight size={15} />}
          </button>
        </form>

        {/* Footer */}
        <div
          className="border-ink-200 text-ink-500 mt-7 border-t pt-5 text-center"
          style={{ fontSize: 12.5 }}
        >
          Stuck? Ping <span className="text-ink-1000 font-semibold">#hours-help</span> on Slack.
        </div>
      </div>
    </div>
  )
}
