# BFF Feature Slices — Acyclic Service Dependency Graph

Every service may call any repository in `db/repositories/`.  
Cross-slice service-to-service calls are **only** permitted where listed below.  
Any call not listed is a **lint error** (see `apps/api/eslint-local.mjs`).

## Declared cross-slice service calls

```
admin-users  →  time-entries   (timeEntriesService.rejectAllSubmittedFor)
admin-users  →  timer          (timerService.discardActiveSessionFor)
```

All other slices have no cross-slice service dependencies.

## Rules

1. Services may call any repository (`db/repositories/*`) directly.
2. Services must NEVER import another slice's `routes` file.
3. To add a cross-slice service call:
   - Add an entry to this table with the called function name.
   - Add a `// cross-slice: declared — <reason>` comment on the import line.
   - Verify the graph remains acyclic (no A → B → A cycles).
   - Failing to update this table is a blocking code-review failure.

## Why this matters

Cross-slice calls through services (not repos) ensure all business logic for a domain
stays in its owning service. If `admin-users` called `timeEntriesRepo` directly, any
future side-effects added to `timeEntriesService` (cache invalidation, audit log, etc.)
would silently be bypassed. Routing through the owning service makes the call
future-proof at zero extra cost.

See `docs/dev_plan.md §1.3` for the full rationale.
