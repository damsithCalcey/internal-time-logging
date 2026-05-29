import adminUsersRoutes from '@/routes/admin-users.js'
import approvalsRoutes from '@/routes/approvals.js'
import authRoutes from '@/routes/auth.js'
import projectRoutes from '@/routes/projects.js'
import taskRoutes from '@/routes/tasks.js'
import timeEntriesRoutes from '@/routes/time-entries.js'
import userRoutes from '@/routes/users.js'
import { authMiddleware, type AppEnv } from '@/shared/auth.js'
import { HttpError } from '@/shared/errors.js'
import { logger } from '@/shared/logger.js'
import type { HealthResponse } from '@repo/shared-types'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger as honoLogger } from 'hono/logger'

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
api.route('/', projectRoutes)
api.route('/', taskRoutes)
api.route('/', userRoutes)
api.route('/', timeEntriesRoutes)
api.route('/', adminUsersRoutes)
api.route('/', approvalsRoutes)

app.route('/', api)

// Global error handler
app.onError((err, c) => {
  if (err instanceof HttpError) {
    return c.json(
      { error: err.message, code: err.code },
      err.status as 400 | 401 | 403 | 404 | 405 | 409,
    )
  }
  logger.error({ err }, 'Unhandled error')
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
