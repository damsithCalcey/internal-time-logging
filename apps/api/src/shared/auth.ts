import type { UserRole } from '@repo/shared-types'
import { createMiddleware } from 'hono/factory'
import { createRemoteJWKSet, jwtVerify } from 'jose'

export type AuthUser = {
  id: string
  role: UserRole
  isActive: boolean
  fullName: string
  email: string
}

export type AppEnv = {
  Variables: {
    user: AuthUser
  }
}

// JWKS is resolved lazily so the server can start before SUPABASE_URL is validated
let _jwks: ReturnType<typeof createRemoteJWKSet> | null = null

function getJwks() {
  if (!_jwks) {
    const supabaseUrl = process.env['SUPABASE_URL']
    if (!supabaseUrl) throw new Error('SUPABASE_URL is required')
    _jwks = createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`))
  }
  return _jwks
}

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.slice(7)

  try {
    const issuer = process.env['SUPABASE_JWT_ISSUER']
    const { payload } = await jwtVerify(token, getJwks(), issuer ? { issuer } : undefined)

    const userId = payload.sub
    const email = (payload['email'] as string | undefined) ?? ''
    const appMetadata = payload['app_metadata'] as Record<string, unknown> | undefined
    const role = appMetadata?.['role'] as UserRole | undefined
    const isActive = appMetadata?.['is_active'] as boolean | undefined
    const fullName = (appMetadata?.['full_name'] as string | undefined) ?? ''

    if (!userId) return c.json({ error: 'Unauthorized' }, 401)
    // role missing means auth hook is misconfigured — fail loudly
    if (!role) return c.json({ error: 'Unauthorized', detail: 'auth hook misconfigured' }, 401)
    if (isActive === false) return c.json({ error: 'Forbidden' }, 403)

    c.set('user', { id: userId, role, isActive: isActive ?? true, fullName, email })
    await next()
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
})

// Blocks non-manager roles. Managers can also access all-user routes.
export const requireRole = (role: UserRole) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const user = c.get('user')
    if (user.role !== role) {
      return c.json({ error: 'Forbidden' }, 403)
    }
    await next()
  })

// Alias for clarity in route definitions — any authenticated, active user passes
export const requireAuth = createMiddleware<AppEnv>(async (_c, next) => {
  // authMiddleware already ran; just continue
  await next()
})
