/**
 * Local ESLint rules enforcing the architectural boundaries declared in
 * apps/api/src/features/README.md and docs/decisions.md.
 *
 * Rule 1 (error):  no-cross-slice-route-import
 *   A file inside features/X must never import features/Y/routes.
 *
 * Rule 2 (warn):   no-undocumented-cross-slice-service
 *   A file inside features/X importing features/Y/service must be in the
 *   declared acyclic dependency graph; the import needs a justification comment.
 *
 * Rule 3 (error):  no-drizzle-in-features
 *   Files under features/** must not import drizzle-orm or db/schema directly.
 *   Repositories own DB access; services consume the typed repo bindings
 *   from db/repositories/index.ts. This catches the "inline Drizzle in a
 *   service" drift documented in commit 6c9aee1 / SUBMISSION.md.
 */

const sliceOf = (filename) => {
  const m = filename.replace(/\\/g, '/').match(/features\/([^/]+)\//)
  return m ? m[1] : null
}

const targetSliceOf = (source) => {
  const m = source.replace(/\\/g, '/').match(/features\/([^/]+)\//)
  return m ? m[1] : null
}

const noRouteImport = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow importing another slice\'s routes file.' },
    messages: {
      error:
        "Cross-slice route import from '{{target}}': services must never import routes. " +
        'Call the owning service directly instead.',
    },
    schema: [],
  },
  create(context) {
    const current = sliceOf(context.filename ?? context.getFilename())
    if (!current) return {}
    return {
      ImportDeclaration(node) {
        const src = node.source.value
        const target = targetSliceOf(src)
        if (!target || target === current) return
        if (/\/routes(\.ts)?$/.test(src) || /\/routes\//.test(src)) {
          context.report({ node, messageId: 'error', data: { target } })
        }
      },
    }
  },
}

const noUndocumentedService = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Warn on cross-slice service imports not in the declared acyclic dependency graph.' },
    messages: {
      warn:
        "Cross-slice service import from '{{target}}': verify this is in the declared " +
        'acyclic dependency graph (apps/api/src/features/README.md) and add a ' +
        '// cross-slice: declared — <reason> comment on the import.',
    },
    schema: [],
  },
  create(context) {
    const current = sliceOf(context.filename ?? context.getFilename())
    if (!current) return {}
    return {
      ImportDeclaration(node) {
        const src = node.source.value
        const target = targetSliceOf(src)
        if (!target || target === current) return
        if (/\/service(\.ts)?$/.test(src) || /\/service\//.test(src)) {
          context.report({ node, messageId: 'warn', data: { target } })
        }
      },
    }
  },
}

const noDrizzleInFeatures = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow drizzle-orm and db/schema imports inside feature slices. ' +
        'Repositories own DB access; services consume typed repo bindings.',
    },
    messages: {
      error:
        "Feature code must not import '{{source}}'. Put the query in a repository " +
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

export default {
  rules: {
    'no-cross-slice-route-import': noRouteImport,
    'no-undocumented-cross-slice-service': noUndocumentedService,
    'no-drizzle-in-features': noDrizzleInFeatures,
  },
}
