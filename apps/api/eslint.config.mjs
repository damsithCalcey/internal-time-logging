import { base } from '@repo/eslint-config'
import localRules from './eslint-local.mjs'

export default [
  ...base,
  {
    plugins: { local: localRules },
  },
  // Use cases and routes must not import drizzle-orm or db/schema — repos own DB access
  {
    files: ['src/useCases/**/*.ts', 'src/routes/**/*.ts'],
    rules: {
      'local/no-drizzle-in-use-cases': 'error',
    },
  },
  // Use cases must not depend on the routes layer (would invert the dependency)
  {
    files: ['src/useCases/**/*.ts'],
    rules: {
      'local/no-route-import-in-use-cases': 'error',
    },
  },
  {
    ignores: ['dist/**', 'migrations/**'],
  },
]
