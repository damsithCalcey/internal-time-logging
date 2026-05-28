import { http } from '@/shared/http'
import { supabase } from '@/shared/supabase'
import type { MeResponse } from '@repo/shared-types'
import type { Session } from '@supabase/supabase-js'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface AuthContextValue {
  user: MeResponse | null
  session: Session | null
  /** true while session initialises or /me is in-flight */
  isLoading: boolean
  /** set if /me throws (e.g. ApiError 403 = inactive) */
  meError: Error | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  // undefined = not yet determined; null = no session; Session = authenticated
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, s) => {
      setSession(s)
      if (!s) qc.removeQueries({ queryKey: ['me'] })
    })

    return () => subscription.unsubscribe()
  }, [qc])

  const {
    data: user,
    isLoading: meLoading,
    error: meError,
  } = useQuery({
    queryKey: ['me'],
    queryFn: () => http.get<MeResponse>('/me'),
    enabled: !!session,
    retry: false,
    staleTime: 5 * 60_000,
  })

  const isLoading = session === undefined || (!!session && meLoading && !meError)

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        session: session ?? null,
        isLoading,
        meError: meError as Error | null,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
