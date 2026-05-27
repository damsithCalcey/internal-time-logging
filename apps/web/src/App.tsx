import { type HealthResponse, HealthResponseSchema } from '@repo/shared-types'

// Stage 0 smoke test: proves @repo/shared-types is wired.
// A breaking change in HealthResponseSchema will cause this file's typecheck to fail.
const _schemaWiring: HealthResponse = HealthResponseSchema.parse({ ok: true })
void _schemaWiring

export default function App() {
  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-tropical-magenta font-display font-bold text-4xl mb-2">Calcey Hours</p>
        <p className="text-ink-600 text-sm">Stage 0 scaffold — auth and features coming in Stage 2+.</p>
      </div>
    </div>
  )
}
