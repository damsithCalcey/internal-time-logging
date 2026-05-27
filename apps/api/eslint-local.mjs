/**
 * Local ESLint rules enforcing the cross-slice import boundaries defined in
 * apps/api/src/features/README.md.
 *
 * Rule 1 (error):  no-cross-slice-route-import
 *   A file inside features/X must never import features/Y/routes.
 *
 * Rule 2 (warn):   no-undocumented-cross-slice-service
 *   A file inside features/X importing features/Y/service must be in the
 *   declared acyclic dependency graph; the import needs a justification comment.
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

export default {
  rules: {
    'no-cross-slice-route-import': noRouteImport,
    'no-undocumented-cross-slice-service': noUndocumentedService,
  },
}
