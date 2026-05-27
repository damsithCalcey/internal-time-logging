import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import type { UserRole } from '@repo/shared-types'
import { useAuth } from './AuthProvider'

interface Props {
  role: UserRole
  children: ReactNode
}

export function RequireRole({ role, children }: Props) {
  const { user } = useAuth()

  if (!user || user.role !== role) {
    return <Navigate to="/app" replace />
  }

  return <>{children}</>
}
