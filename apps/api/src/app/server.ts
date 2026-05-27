import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger as honoLogger } from 'hono/logger'
import type { HealthResponse } from '@repo/shared-types'
import { authMiddleware, type AppEnv } from '@/shared/auth.js'
import { HttpError } from '@/shared/errors.js'
import { logger } from '@/shared/logger.js'
import authRoutes from '@/features/auth/routes.js'

export const app = new Hono()

app.use('*', honoLogger())
app.use(
  '*',
  cors({
    origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173',
  }),
)

// Unauthenticated
app.get('/health', (c) => c.json<HealthResponse>({ ok: true }))

// All routes below require a valid JWT
const api = new Hono<AppEnv>()
api.use('*', authMiddleware)
api.route('/', authRoutes)

app.route('/', api)

// Global error handler
app.onError((err, c) => {
  if (err instanceof HttpError) {
    return c.json({ error: err.message, code: err.code }, err.status as 400 | 401 | 403 | 404 | 405 | 409)
  }
  logger.error({ err }, 'Unhandled error')
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
