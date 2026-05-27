import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Load .env into process.env for integration tests (no dotenv dep needed)
try {
  const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8')
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    let val = trimmed.slice(idx + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    process.env[key] ??= val
  }
} catch {
  // no .env file — CI will supply vars via environment
}
