import { AuthProvider } from '@/features/auth/AuthProvider'
import { queryClient } from '@/shared/query-client'
import { QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}
