import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import type { HealthResponse } from '@repo/shared-types'

export const app = new Hono()

app.use('*', logger())
app.use(
  '*',
  cors({
    origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173',
  }),
)

app.get('/health', (c) => {
  return c.json<HealthResponse>({ ok: true })
})

export default app
