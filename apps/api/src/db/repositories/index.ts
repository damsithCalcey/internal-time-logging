// Barrel: services import typed repo objects from here.
// Each repository file owns its own contract (the *Repo interface) and asserts
// the binding via `satisfies`. Services depend on the binding object, not the
// individual named exports — `import { usersRepo } from '@/db/repositories'`.
//
// The "inline Drizzle in a service" drift (commit 6c9aee1) is structurally
// prevented by:
//   1. This boundary (services touch the bound API, not the schema), and
//   2. The `no-drizzle-in-features` ESLint rule (apps/api/eslint-local.mjs)
//      that fails CI if a feature file imports drizzle-orm or db/schema.
export { projectsRepo } from './projects.js'
export type { ProjectListRow, ProjectTaskRow, ProjectsRepo } from './projects.js'
export { tasksRepo } from './tasks.js'
export type { TasksRepo } from './tasks.js'
export { timeEntriesRepo } from './time-entries.js'
export type {
  EnrichedLogFilters,
  EnrichedTimeEntryRow,
  QueueFilters,
  TimeEntriesRepo,
  TimeEntryPatch,
} from './time-entries.js'
export { timerSessionsRepo } from './timer-sessions.js'
export type { TimerSessionsRepo } from './timer-sessions.js'
export { userProjectsRepo } from './user-projects.js'
export type { ProjectMemberRow, UserProjectsRepo } from './user-projects.js'
export { usersRepo } from './users.js'
export type { UsersRepo } from './users.js'
