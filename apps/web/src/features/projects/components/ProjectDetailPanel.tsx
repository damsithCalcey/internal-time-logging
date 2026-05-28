import { zodResolver } from '@hookform/resolvers/zod'
import type {
  CreateTaskBody,
  ProjectDetail,
  UpdateProjectBody,
  UserOption,
} from '@repo/shared-types'
import { CreateTaskBodySchema, UpdateProjectBodySchema } from '@repo/shared-types'
import { Check, Pencil, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  useActiveUsers,
  useAssignUser,
  useCreateTask,
  useProjectDetail,
  useUnassignUser,
  useUpdateProject,
  useUpdateTask,
} from '../hooks'
import { initials, projectCode, projectColor } from '../utils'

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

// ── Edit project inline form ──────────────────────────────────────

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
    <form onSubmit={handleSubmit(onSubmit)} className="mt-1 flex flex-col gap-1">
      <div className="flex items-center gap-2">
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
      </div>
      {errors.name && (
        <p className="text-koha-red font-display px-1" style={{ fontSize: 11 }}>
          {errors.name.message}
        </p>
      )}
      {createTask.error && (
        <p className="text-koha-red font-display px-1" style={{ fontSize: 11 }}>
          {(createTask.error as { message?: string })?.message ?? 'Failed to create task'}
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

        {assign.error && (
          <p className="text-koha-red font-display mb-2" style={{ fontSize: 12 }}>
            {(assign.error as { message?: string })?.message ?? 'Failed to assign member'}
          </p>
        )}

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

export function ProjectDetailPanel({ projectId }: { projectId: string }) {
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
                  className="flex flex-1 flex-col gap-1"
                  onSubmit={(e) => {
                    e.preventDefault()
                    const input = e.currentTarget.elements.namedItem('name') as HTMLInputElement
                    updateTask.mutate(
                      { taskId: task.id, body: { name: input.value.trim() || task.name } },
                      { onSuccess: () => setEditingTaskId(null) },
                    )
                  }}
                >
                  <div className="flex items-center gap-2">
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
                  </div>
                  {updateTask.error && (
                    <p className="text-koha-red font-display" style={{ fontSize: 11 }}>
                      {(updateTask.error as { message?: string })?.message ??
                        'Failed to update task'}
                    </p>
                  )}
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
