import { zodResolver } from '@hookform/resolvers/zod'
import type {
  CreateProjectBody,
  CreateTaskBody,
  ProjectDetail,
  ProjectListItem,
  UpdateProjectBody,
  UserOption,
} from '@repo/shared-types'
import {
  CreateProjectBodySchema,
  CreateTaskBodySchema,
  UpdateProjectBodySchema,
} from '@repo/shared-types'
import { Check, ChevronRight, Folder, Layers, Pencil, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  useActiveUsers,
  useAssignUser,
  useCreateProject,
  useCreateTask,
  useProjectDetail,
  useProjects,
  useProjectStats,
  useUnassignUser,
  useUpdateProject,
  useUpdateTask,
} from './hooks'

// ── Helpers ───────────────────────────────────────────────────────

const PROJECT_COLORS = [
  '#AD1AAC',
  '#307FE2',
  '#2C9F69',
  '#E8A33A',
  '#DF4661',
  '#59CBE8',
  '#8E158D',
  '#1A4F96',
]

function projectColor(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return PROJECT_COLORS[h % PROJECT_COLORS.length]!
}

function projectCode(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 3)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
    .padEnd(3, name[1]?.toUpperCase() ?? 'X')
    .slice(0, 3)
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
}

// ── Stat card ─────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  dark,
}: {
  label: string
  value: string | number
  dark?: boolean
}) {
  return (
    <div
      className="flex flex-col gap-1 rounded-2xl px-5 py-4"
      style={{
        background: dark ? 'var(--ink-1000)' : '#fff',
        border: dark ? 'none' : '1px solid var(--ink-200)',
        boxShadow: dark ? 'none' : '0 1px 3px rgba(11,11,18,0.04)',
        minWidth: 0,
      }}
    >
      <p
        className="font-mono font-semibold uppercase"
        style={{
          fontSize: 10.5,
          letterSpacing: '0.14em',
          color: dark ? 'rgba(255,255,255,0.55)' : 'var(--ink-500)',
        }}
      >
        {label}
      </p>
      <p
        className="font-display font-black"
        style={{
          fontSize: 36,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          color: dark ? 'var(--tropical-magenta)' : 'var(--ink-1000)',
        }}
      >
        {value}
      </p>
    </div>
  )
}

// ── Member chip ───────────────────────────────────────────────────

function MemberChip({ name }: { name: string }) {
  return (
    <span
      className="font-display text-ink-800 inline-flex items-center gap-1.5"
      style={{
        fontSize: 12.5,
        fontWeight: 500,
        background: 'var(--ink-50)',
        border: '1px solid var(--ink-200)',
        borderRadius: 999,
        padding: '3px 10px 3px 4px',
      }}
    >
      <span
        className="font-display flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full font-bold text-white"
        style={{ fontSize: 9, background: 'var(--ink-600)' }}
      >
        {initials(name)}
      </span>
      {name.split(' ')[0]}
    </span>
  )
}

// ── Avatar stack ─────────────────────────────────────────────────

function AvatarStack({ count, names }: { count: number; names: string[] }) {
  const visible = names.slice(0, 3)
  const extra = count - visible.length
  return (
    <span className="flex items-center">
      {visible.map((n, i) => (
        <span
          key={n}
          className="font-display flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-white font-bold text-white"
          style={{ fontSize: 8, background: 'var(--ink-500)', marginLeft: i === 0 ? 0 : -6 }}
          title={n}
        >
          {initials(n)}
        </span>
      ))}
      {extra > 0 && (
        <span
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-white font-mono font-semibold"
          style={{
            fontSize: 8,
            background: 'var(--ink-200)',
            color: 'var(--ink-600)',
            marginLeft: -6,
          }}
        >
          +{extra}
        </span>
      )}
    </span>
  )
}

// ── Create project modal ──────────────────────────────────────────

function CreateProjectModal({ onClose }: { onClose: () => void }) {
  const createProject = useCreateProject()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProjectBody>({
    resolver: zodResolver(CreateProjectBodySchema),
  })

  function onSubmit(data: CreateProjectBody) {
    createProject.mutate(data, { onSuccess: onClose })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(11,11,18,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white"
        style={{ padding: '28px 32px', boxShadow: '0 24px 64px rgba(11,11,18,0.18)' }}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p
              className="text-ink-500 font-mono font-semibold uppercase"
              style={{ fontSize: 10.5, letterSpacing: '0.14em' }}
            >
              New project
            </p>
            <h2
              className="font-display text-ink-1000 font-bold"
              style={{ fontSize: 20, letterSpacing: '-0.01em' }}
            >
              Create project
            </h2>
          </div>
          <button
            onClick={onClose}
            className="bg-ink-100 text-ink-600 hover:bg-ink-200 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-display text-ink-800 font-semibold" style={{ fontSize: 12.5 }}>
              Project name
            </label>
            <input
              {...register('name')}
              className="field-input border-ink-200 font-display text-ink-1000 placeholder:text-ink-400 w-full rounded-xl border bg-white px-3.5 py-2.5 outline-none"
              style={{ fontSize: 14 }}
              placeholder="e.g. Upflex Platform"
              autoFocus
            />
            {errors.name && (
              <p className="text-koha-red font-display" style={{ fontSize: 12 }}>
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-display text-ink-800 font-semibold" style={{ fontSize: 12.5 }}>
              Description <span className="text-ink-400 font-normal">(optional)</span>
            </label>
            <textarea
              {...register('description')}
              className="field-input border-ink-200 font-display text-ink-1000 placeholder:text-ink-400 w-full resize-none rounded-xl border bg-white px-3.5 py-2.5 outline-none"
              style={{ fontSize: 14, minHeight: 80 }}
              placeholder="What is this project about?"
            />
          </div>

          {createProject.error && (
            <p className="text-koha-red font-display" style={{ fontSize: 13 }}>
              {(createProject.error as { message?: string })?.message ?? 'Something went wrong'}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="border-ink-200 font-display text-ink-700 hover:bg-ink-50 rounded-full border px-4 py-2 font-semibold transition-colors"
              style={{ fontSize: 13.5 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createProject.isPending}
              className="font-display rounded-full px-5 py-2 font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ fontSize: 13.5, background: 'var(--tropical-magenta)' }}
            >
              {createProject.isPending ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Edit project inline form ───────────────────────────────────────

function EditProjectForm({ project, onDone }: { project: ProjectDetail; onDone: () => void }) {
  const update = useUpdateProject(project.id)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProjectBody>({
    resolver: zodResolver(UpdateProjectBodySchema),
    defaultValues: { name: project.name, description: project.description ?? '' },
  })

  function onSubmit(data: UpdateProjectBody) {
    update.mutate(data, { onSuccess: onDone })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <input
          {...register('name')}
          className="field-input border-ink-200 font-display text-ink-1000 w-full rounded-xl border bg-white px-3 py-2 font-bold outline-none"
          style={{ fontSize: 20, letterSpacing: '-0.01em' }}
          autoFocus
        />
        {errors.name && (
          <p className="text-koha-red font-display" style={{ fontSize: 12 }}>
            {errors.name.message}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <textarea
          {...register('description')}
          className="field-input border-ink-200 font-display text-ink-700 w-full resize-none rounded-xl border bg-white px-3 py-2 outline-none"
          style={{ fontSize: 13.5, minHeight: 64 }}
          placeholder="Description (optional)"
        />
      </div>
      {update.error && (
        <p className="text-koha-red font-display" style={{ fontSize: 12 }}>
          {(update.error as { message?: string })?.message ?? 'Something went wrong'}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={update.isPending}
          className="font-display flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ background: 'var(--tropical-magenta)' }}
        >
          <Check size={12} /> Save
        </button>
        <button
          type="button"
          onClick={onDone}
          className="font-display text-ink-600 border-ink-200 hover:bg-ink-50 flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors"
        >
          <X size={12} /> Cancel
        </button>
      </div>
    </form>
  )
}

// ── Add task inline form ──────────────────────────────────────────

function AddTaskForm({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const createTask = useCreateTask(projectId)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTaskBody>({
    resolver: zodResolver(CreateTaskBodySchema),
  })

  function onSubmit(data: CreateTaskBody) {
    createTask.mutate(data, {
      onSuccess: () => {
        reset()
        onDone()
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-1 flex items-center gap-2">
      <input
        {...register('name')}
        className="field-input border-ink-200 font-display text-ink-1000 placeholder:text-ink-400 flex-1 rounded-xl border bg-white px-3 py-2 outline-none"
        style={{ fontSize: 13.5 }}
        placeholder="Task name"
        autoFocus
      />
      <button
        type="submit"
        disabled={createTask.isPending}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-white transition-opacity disabled:opacity-60"
        style={{ background: 'var(--tropical-magenta)' }}
        title="Add task"
      >
        <Check size={13} />
      </button>
      <button
        type="button"
        onClick={onDone}
        className="text-ink-500 bg-ink-100 hover:bg-ink-200 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors"
        title="Cancel"
      >
        <X size={13} />
      </button>
      {errors.name && (
        <p className="text-koha-red font-display absolute" style={{ fontSize: 11 }}>
          {errors.name.message}
        </p>
      )}
    </form>
  )
}

// ── Assign user picker ─────────────────────────────────────────────

function AssignUserPicker({
  projectId,
  currentMemberIds,
  onClose,
}: {
  projectId: string
  currentMemberIds: Set<string>
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const { data: allUsers = [] } = useActiveUsers()
  const assign = useAssignUser(projectId)

  const available = allUsers.filter(
    (u: UserOption) =>
      !currentMemberIds.has(u.id) &&
      (u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())),
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(11,11,18,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white"
        style={{ padding: '24px', boxShadow: '0 24px 64px rgba(11,11,18,0.18)' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3
            className="font-display text-ink-1000 font-bold"
            style={{ fontSize: 16, letterSpacing: '-0.01em' }}
          >
            Assign member
          </h3>
          <button
            onClick={onClose}
            className="bg-ink-100 text-ink-600 hover:bg-ink-200 flex h-7 w-7 items-center justify-center rounded-full transition-colors"
          >
            <X size={13} />
          </button>
        </div>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="field-input border-ink-200 bg-ink-50 font-display text-ink-1000 placeholder:text-ink-400 mb-3 w-full rounded-xl border px-3 py-2 outline-none"
          style={{ fontSize: 13.5 }}
          placeholder="Search by name or email…"
          autoFocus
        />

        <div className="flex max-h-56 flex-col gap-0.5 overflow-y-auto">
          {available.length === 0 && (
            <p className="text-ink-500 font-display py-3 text-center" style={{ fontSize: 13 }}>
              {search ? 'No users match' : 'All active users are assigned'}
            </p>
          )}
          {available.map((u: UserOption) => (
            <button
              key={u.id}
              onClick={() => assign.mutate({ userId: u.id }, { onSuccess: onClose })}
              disabled={assign.isPending}
              className="hover:bg-ink-50 flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors disabled:opacity-50"
            >
              <span
                className="font-display flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold text-white"
                style={{ fontSize: 11, background: 'var(--ink-600)' }}
              >
                {initials(u.fullName)}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className="font-display text-ink-900 truncate font-semibold"
                  style={{ fontSize: 13.5 }}
                >
                  {u.fullName}
                </p>
                <p className="text-ink-500 truncate font-mono" style={{ fontSize: 10.5 }}>
                  {u.email}
                </p>
              </div>
              <span
                className="flex-shrink-0 font-mono font-semibold uppercase"
                style={{
                  fontSize: 9.5,
                  letterSpacing: '0.1em',
                  color: u.role === 'manager' ? 'var(--tropical-magenta)' : 'var(--ink-400)',
                }}
              >
                {u.role}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Project detail panel ──────────────────────────────────────────

function ProjectDetailPanel({ projectId }: { projectId: string }) {
  const [editing, setEditing] = useState(false)
  const [addingTask, setAddingTask] = useState(false)
  const [assigningUser, setAssigningUser] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)

  const { data: detail, isLoading } = useProjectDetail(projectId)
  const updateTask = useUpdateTask(projectId)
  const unassign = useUnassignUser(projectId)

  if (isLoading || !detail) {
    return (
      <div className="text-ink-400 flex h-48 items-center justify-center">
        <p className="font-display" style={{ fontSize: 14 }}>
          Loading…
        </p>
      </div>
    )
  }

  const color = projectColor(detail.id)
  const code = projectCode(detail.name)
  const memberIds = new Set(detail.members.map((m) => m.userId))

  return (
    <div className="flex h-full flex-col overflow-y-auto" style={{ padding: '20px 22px' }}>
      {/* Header */}
      <div className="mb-4 flex items-start gap-3">
        <div
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg font-mono font-bold text-white"
          style={{ background: color, fontSize: 9.5, letterSpacing: '0.05em' }}
        >
          {code}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-ink-500 font-mono font-semibold uppercase"
            style={{ fontSize: 9.5, letterSpacing: '0.14em' }}
          >
            {code} · Active
          </p>
          {editing ? (
            <EditProjectForm project={detail} onDone={() => setEditing(false)} />
          ) : (
            <>
              <h2
                className="font-display text-ink-1000 mt-0.5 font-bold"
                style={{ fontSize: 20, letterSpacing: '-0.01em', lineHeight: 1.2 }}
              >
                {detail.name}
              </h2>
              {detail.description && (
                <p className="text-ink-600 mt-1" style={{ fontSize: 13.5, lineHeight: 1.5 }}>
                  {detail.description}
                </p>
              )}
            </>
          )}
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="bg-ink-100 text-ink-500 hover:bg-ink-200 hover:text-ink-800 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-colors"
            title="Edit project"
          >
            <Pencil size={12} />
          </button>
        )}
      </div>

      {/* Tasks section */}
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-display text-ink-900 font-bold" style={{ fontSize: 13.5 }}>
            Tasks
            <span className="text-ink-400 ml-1.5 font-mono" style={{ fontSize: 12 }}>
              {detail.tasks.length}
            </span>
          </p>
        </div>
        <div className="flex flex-col gap-0.5">
          {detail.tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
              style={{ background: 'var(--ink-50)' }}
            >
              <span
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ background: task.isActive ? color : 'var(--ink-300)' }}
              />
              {editingTaskId === task.id ? (
                <form
                  className="flex flex-1 items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    const input = e.currentTarget.elements.namedItem('name') as HTMLInputElement
                    updateTask.mutate(
                      { taskId: task.id, body: { name: input.value.trim() || task.name } },
                      { onSuccess: () => setEditingTaskId(null) },
                    )
                  }}
                >
                  <input
                    name="name"
                    defaultValue={task.name}
                    className="field-input border-ink-200 font-display text-ink-1000 flex-1 rounded-lg border bg-white px-2.5 py-1.5 outline-none"
                    style={{ fontSize: 13 }}
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={updateTask.isPending}
                    className="text-tropical-magenta transition-opacity hover:opacity-75 disabled:opacity-40"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTaskId(null)}
                    className="text-ink-400 hover:text-ink-700 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </form>
              ) : (
                <>
                  <span
                    className="font-display text-ink-900 flex-1 truncate"
                    style={{
                      fontSize: 13.5,
                      fontWeight: task.isActive ? 500 : 400,
                      color: task.isActive ? 'var(--ink-900)' : 'var(--ink-400)',
                    }}
                  >
                    {task.name}
                  </span>
                  {!task.isActive && (
                    <span
                      className="text-ink-400 flex-shrink-0 font-mono"
                      style={{ fontSize: 9.5, letterSpacing: '0.1em' }}
                    >
                      INACTIVE
                    </span>
                  )}
                  <button
                    onClick={() => setEditingTaskId(task.id)}
                    className="text-ink-400 hover:text-ink-700 hover:bg-ink-200 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full opacity-0 transition-all group-hover:opacity-100"
                    title="Edit task"
                  >
                    <Pencil size={11} />
                  </button>
                  <button
                    onClick={() =>
                      updateTask.mutate({ taskId: task.id, body: { isActive: !task.isActive } })
                    }
                    className="text-ink-400 hover:bg-ink-200 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full opacity-60 transition-all hover:opacity-100"
                    title={task.isActive ? 'Deactivate task' : 'Activate task'}
                  >
                    {task.isActive ? <X size={11} /> : <Check size={11} />}
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {addingTask ? (
          <AddTaskForm projectId={projectId} onDone={() => setAddingTask(false)} />
        ) : (
          <button
            onClick={() => setAddingTask(true)}
            className="font-display text-ink-500 hover:text-ink-800 hover:border-ink-300 hover:bg-ink-50 mt-2 flex w-full items-center gap-2 rounded-xl border px-3 py-2 font-semibold transition-all"
            style={{ fontSize: 13, borderStyle: 'dashed', borderColor: 'var(--ink-200)' }}
          >
            <Plus size={14} /> Add task
          </button>
        )}
      </div>

      {/* Members section */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="font-display text-ink-900 font-bold" style={{ fontSize: 13.5 }}>
            Assigned
            <span className="text-ink-400 ml-1.5 font-mono" style={{ fontSize: 12 }}>
              {detail.members.length}
            </span>
          </p>
          <button
            onClick={() => setAssigningUser(true)}
            className="text-tropical-magenta border-magenta-200 hover:bg-magenta-100 flex h-6 w-6 items-center justify-center rounded-full border transition-colors"
            title="Assign member"
          >
            <Plus size={12} />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {detail.members.map((m) => (
            <div key={m.userId} className="group relative">
              <MemberChip name={m.fullName} />
              <button
                onClick={() => unassign.mutate(m.userId)}
                className="bg-ink-400 hover:bg-koha-red absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-white opacity-0 transition-opacity group-hover:opacity-100"
                title={`Remove ${m.fullName}`}
              >
                <X size={8} />
              </button>
            </div>
          ))}
          {detail.members.length === 0 && (
            <p className="text-ink-400 font-display" style={{ fontSize: 13 }}>
              No members assigned yet.
            </p>
          )}
        </div>
      </div>

      {assigningUser && (
        <AssignUserPicker
          projectId={projectId}
          currentMemberIds={memberIds}
          onClose={() => setAssigningUser(false)}
        />
      )}
    </div>
  )
}

// ── Projects list ─────────────────────────────────────────────────

function ProjectRow({
  project,
  selected,
  onClick,
}: {
  project: ProjectListItem
  selected: boolean
  onClick: () => void
}) {
  const color = projectColor(project.id)
  const code = projectCode(project.name)

  return (
    <tr
      onClick={onClick}
      className="group cursor-pointer transition-colors"
      style={{ background: selected ? 'var(--magenta-100)' : undefined }}
    >
      <td className="px-4 py-3" style={{ borderBottom: '1px solid var(--ink-100)' }}>
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg font-mono font-bold text-white"
            style={{ background: color, fontSize: 9, letterSpacing: '0.05em' }}
          >
            {code}
          </div>
          <div>
            <p
              className="font-display text-ink-900 group-hover:text-ink-1000 font-semibold transition-colors"
              style={{ fontSize: 13.5 }}
            >
              {project.name}
            </p>
            <p
              className="text-ink-400 font-mono uppercase"
              style={{ fontSize: 9.5, letterSpacing: '0.12em' }}
            >
              Active
            </p>
          </div>
        </div>
      </td>
      <td
        className="px-3 py-3 text-right"
        style={{ borderBottom: '1px solid var(--ink-100)', width: 70 }}
      >
        <span className="font-display text-ink-900 font-bold" style={{ fontSize: 16 }}>
          {project.taskCount}
        </span>
      </td>
      <td className="px-3 py-3" style={{ borderBottom: '1px solid var(--ink-100)', width: 80 }}>
        <AvatarStack count={project.memberCount} names={[]} />
      </td>
      <td
        className="px-3 py-3 text-right"
        style={{ borderBottom: '1px solid var(--ink-100)', width: 36 }}
      >
        <ChevronRight
          size={14}
          className="text-ink-300 group-hover:text-ink-500 transition-colors"
        />
      </td>
    </tr>
  )
}

// ── Main page ─────────────────────────────────────────────────────

export function ProjectsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const { data: projects = [], isLoading } = useProjects()
  const { data: stats } = useProjectStats()

  const projectCount = stats?.projectCount ?? projects.length
  const taskCount = stats?.taskCount ?? projects.reduce((s, p) => s + p.taskCount, 0)
  const memberCount = stats?.memberCount ?? 0

  return (
    <div className="flex h-full flex-col gap-5" style={{ minHeight: 0 }}>
      {/* Stat strip */}
      <div className="grid grid-cols-4 gap-4" style={{ gridTemplateColumns: '1.4fr 1fr 1fr 1fr' }}>
        <StatCard label="Active projects" value={projectCount} dark />
        <StatCard label="Tasks" value={taskCount} />
        <StatCard label="Team members" value={memberCount} />
        <StatCard label="Logged this wk" value="—" />
      </div>

      {/* 2-column layout */}
      <div
        className="flex min-h-0 flex-1 gap-4"
        style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}
      >
        {/* Projects list */}
        <div
          className="flex flex-col overflow-hidden rounded-2xl bg-white"
          style={{ border: '1px solid var(--ink-200)', boxShadow: '0 1px 3px rgba(11,11,18,0.04)' }}
        >
          {/* List header */}
          <div
            className="flex flex-shrink-0 items-center justify-between px-4 py-3.5"
            style={{ borderBottom: '1px solid var(--ink-100)' }}
          >
            <h4 className="font-display text-ink-1000 font-bold" style={{ fontSize: 14 }}>
              All projects
            </h4>
            <button
              onClick={() => setShowCreate(true)}
              className="font-display flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-semibold text-white transition-opacity hover:opacity-90"
              style={{ fontSize: 12.5, background: 'var(--tropical-magenta)' }}
            >
              <Plus size={13} /> New project
            </button>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="text-ink-400 flex h-32 items-center justify-center">
                <p className="font-display" style={{ fontSize: 14 }}>
                  Loading projects…
                </p>
              </div>
            ) : projects.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-3">
                <Folder size={32} className="text-ink-300" />
                <div className="text-center">
                  <p className="font-display text-ink-700 font-semibold" style={{ fontSize: 14 }}>
                    No projects yet
                  </p>
                  <p className="font-display text-ink-400" style={{ fontSize: 13 }}>
                    Create your first project to get started.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreate(true)}
                  className="font-display mt-1 flex items-center gap-1.5 rounded-full px-4 py-2 font-semibold text-white"
                  style={{ fontSize: 13, background: 'var(--tropical-magenta)' }}
                >
                  <Plus size={13} /> Create project
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr style={{ background: 'var(--ink-50)' }}>
                    <th
                      className="text-ink-500 px-4 py-2.5 text-left font-mono font-semibold uppercase"
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.12em',
                        borderBottom: '1px solid var(--ink-100)',
                      }}
                    >
                      Project
                    </th>
                    <th
                      className="text-ink-500 px-3 py-2.5 text-right font-mono font-semibold uppercase"
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.12em',
                        borderBottom: '1px solid var(--ink-100)',
                        width: 70,
                      }}
                    >
                      Tasks
                    </th>
                    <th
                      className="text-ink-500 px-3 py-2.5 font-mono font-semibold uppercase"
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.12em',
                        borderBottom: '1px solid var(--ink-100)',
                        width: 80,
                      }}
                    >
                      Members
                    </th>
                    <th style={{ width: 36, borderBottom: '1px solid var(--ink-100)' }} />
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <ProjectRow
                      key={project.id}
                      project={project}
                      selected={project.id === selectedId}
                      onClick={() => setSelectedId(project.id === selectedId ? null : project.id)}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div
          className="overflow-hidden rounded-2xl bg-white"
          style={{ border: '1px solid var(--ink-200)', boxShadow: '0 1px 3px rgba(11,11,18,0.04)' }}
        >
          {selectedId ? (
            <ProjectDetailPanel key={selectedId} projectId={selectedId} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-10 text-center">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: 'var(--ink-100)' }}
              >
                <Layers size={22} className="text-ink-400" />
              </div>
              <div>
                <p className="font-display text-ink-700 font-semibold" style={{ fontSize: 14 }}>
                  Select a project
                </p>
                <p
                  className="font-display text-ink-400 mt-1"
                  style={{ fontSize: 13, lineHeight: 1.5 }}
                >
                  Click a project in the list to view its tasks and assigned team members.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
