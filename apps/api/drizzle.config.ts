import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './migrations',
  dbCredentials: {
    // Empty string is safe for `db:generate` which doesn't connect.
    // `db:push` and `db:migrate` will fail at connection time if unset.
    url: process.env['DATABASE_URL'] ?? '',
  },
  verbose: true,
  strict: true,
})
