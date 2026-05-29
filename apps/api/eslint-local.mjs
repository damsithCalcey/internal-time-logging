/**
 * Local ESLint rules enforcing clean architecture boundaries.
 *
 * Rule 1 (error): no-drizzle-in-use-cases
 *   Files under useCases/** and routes/** must not import drizzle-orm or db/schema directly.
 *   Repositories own DB access; use cases consume typed repo bindings from db/repositories/index.ts.
 *
 * Rule 2 (error): no-route-import-in-use-cases
 *   Files under useCases/** must never import from routes/.
 *   Dependency direction: routes → useCases → domain; never backwards.
 */

const noDrizzleInUseCases = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow drizzle-orm and db/schema imports inside use cases and routes. ' +
        'Repositories own DB access; use cases consume typed repo bindings.',
    },
    messages: {
      error:
        "Use case / route code must not import '{{source}}'. Put the query in a repository " +
        '(apps/api/src/db/repositories/) and consume it via the typed binding from ' +
        "'@/db/repositories/index.js'.",
    },
    schema: [],
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const src = node.source.value
        if (typeof src !== 'string') return
        const isDrizzle = src === 'drizzle-orm' || src.startsWith('drizzle-orm/')
        const isSchema = /\/db\/schema(\.ts|\.js)?$/.test(src) || src.endsWith('@/db/schema')
        if (isDrizzle || isSchema) {
          context.report({ node, messageId: 'error', data: { source: src } })
        }
      },
    }
  },
}

const noRouteImportInUseCases = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow importing from routes/ inside use case files.' },
    messages: {
      error:
        "Use case code must not import from routes ('{{source}}'). " +
        'Dependency flows routes → useCases → domain, never backwards.',
    },
    schema: [],
  },
  create(context) {
    const filename = (context.filename ?? context.getFilename()).replace(/\\/g, '/')
    if (!filename.includes('/useCases/')) return {}
    return {
      ImportDeclaration(node) {
        const src = node.source.value
        if (typeof src !== 'string') return
        if (/\/routes(\/|\.ts|\.js)?/.test(src) || src.startsWith('@/routes')) {
          context.report({ node, messageId: 'error', data: { source: src } })
        }
      },
    }
  },
}

export default {
  rules: {
    'no-drizzle-in-use-cases': noDrizzleInUseCases,
    'no-route-import-in-use-cases': noRouteImportInUseCases,
  },
}
