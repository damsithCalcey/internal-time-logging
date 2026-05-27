import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ApiError } from '@/shared/http'
import { useAuth } from './AuthProvider'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-9 h-9 rounded-[10px] bg-tropical-magenta flex items-center justify-center animate-pulse"
        >
          <span
            className="text-white font-display font-black"
            style={{ fontSize: 20, letterSpacing: '-0.04em' }}
          >
            c
          </span>
        </div>
        <p className="text-ink-500" style={{ fontSize: 13 }}>Loading…</p>
      </div>
    </div>
  )
}

function DeactivatedScreen() {
  const { session } = useAuth()
  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center p-8">
      <div
        className="w-full max-w-sm bg-white rounded-[24px] border border-ink-200 text-center"
        style={{ padding: '44px 40px', boxShadow: 'var(--shadow-md)' }}
      >
        <div
          className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="9" stroke="#E4002B" strokeWidth="1.5" />
            <path d="M10 5v6M10 13.5v.5" stroke="#E4002B" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <h2
          className="font-display font-bold text-ink-1000 mb-2"
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
            className="w-full font-display font-semibold text-ink-1000 bg-ink-100 rounded-full"
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
  const { user, session, isLoading, meError } = useAuth()
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
