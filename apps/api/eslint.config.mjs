import { base } from '@repo/eslint-config'
import localRules from './eslint-local.mjs'

export default [
  ...base,
  {
    plugins: { local: localRules },
  },
  // Cross-slice route import → hard error (any feature file)
  {
    files: ['src/features/**/*.ts'],
    rules: {
      'local/no-cross-slice-route-import': 'error',
    },
  },
  // Cross-slice service import → warning requiring justification comment (any feature file)
  {
    files: ['src/features/**/*.ts'],
    rules: {
      'local/no-undocumented-cross-slice-service': 'warn',
    },
  },
  {
    ignores: ['dist/**', 'migrations/**'],
  },
]
