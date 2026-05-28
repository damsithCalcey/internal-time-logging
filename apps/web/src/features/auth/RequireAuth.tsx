import { ApiError } from '@/shared/http'
import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

function LoadingScreen() {
  return (
    <div className="bg-ink-50 flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="bg-tropical-magenta flex h-9 w-9 animate-pulse items-center justify-center rounded-[10px]">
          <span
            className="font-display font-black text-white"
            style={{ fontSize: 20, letterSpacing: '-0.04em' }}
          >
            c
          </span>
        </div>
        <p className="text-ink-500" style={{ fontSize: 13 }}>
          Loading…
        </p>
      </div>
    </div>
  )
}

function DeactivatedScreen() {
  const { session } = useAuth()
  return (
    <div className="bg-ink-50 flex min-h-screen items-center justify-center p-8">
      <div
        className="border-ink-200 w-full max-w-sm rounded-[24px] border bg-white text-center"
        style={{ padding: '44px 40px', boxShadow: 'var(--shadow-md)' }}
      >
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="9" stroke="#E4002B" strokeWidth="1.5" />
            <path d="M10 5v6M10 13.5v.5" stroke="#E4002B" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <h2
          className="font-display text-ink-1000 mb-2 font-bold"
          style={{ fontSize: 20, letterSpacing: '-0.01em' }}
        >
          Account deactivated
        </h2>
        <p className="text-ink-600 mb-7 leading-relaxed" style={{ fontSize: 14 }}>
          Your account has been deactivated. Contact your manager to restore access.
        </p>
        {session && (
          <button
            onClick={() => window.location.assign('/login')}
            className="font-display text-ink-1000 bg-ink-100 w-full rounded-full font-semibold"
            style={{ padding: '10px 20px', fontSize: 14, border: 'none', cursor: 'pointer' }}
          >
            Sign out
          </button>
        )}
      </div>
    </div>
  )
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, isLoading, meError } = useAuth()
  const location = useLocation()

  if (isLoading) return <LoadingScreen />

  if (meError instanceof ApiError && meError.status === 403) {
    return <DeactivatedScreen />
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}
