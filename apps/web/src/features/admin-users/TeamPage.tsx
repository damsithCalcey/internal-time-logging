import { zodResolver } from '@hookform/resolvers/zod'
import type { CreateUserBody, UserDetail } from '@repo/shared-types'
import { UpdateUserBodySchema } from '@repo/shared-types'
import { Loader2, Plus, UserCheck, UserX } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

// Local form schema without .default() to avoid exactOptionalPropertyTypes mismatch
const CreateFormSchema = z.object({
  email: z.string().email('Invalid email').trim(),
  fullName: z.string().min(1, 'Full name is required').max(200).trim(),
  role: z.enum(['manager', 'employee']),
  managerId: z.string().uuid().nullable().optional(),
})
type CreateFormValues = z.infer<typeof CreateFormSchema>
import {
  useCreateUser,
  useDeactivateUser,
  useReactivateUser,
  useTeamUsers,
  useUpdateUser,
} from './hooks'

// ── Role badge ────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const isManager = role === 'manager'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono font-semibold uppercase ${
        isManager
          ? 'bg-tropical-magenta/10 text-tropical-magenta'
          : 'bg-ink-100 text-ink-600'
      }`}
      style={{ fontSize: 10, letterSpacing: '0.1em' }}
    >
      {role}
    </span>
  )
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
}

// ── User row card ─────────────────────────────────────────────────

function UserCard({
  user,
  managerName,
  onEdit,
  onDeactivate,
  onReactivate,
  isDeactivating,
  isReactivating,
}: {
  user: UserDetail
  managerName: string | null
  onEdit: () => void
  onDeactivate: () => void
  onReactivate: () => void
  isDeactivating: boolean
  isReactivating: boolean
}) {
  return (
    <div
      className={`rounded-2xl border bg-white px-5 py-4 transition-opacity ${
        user.isActive ? 'border-ink-200' : 'border-ink-200 opacity-60'
      }`}
      style={{ boxShadow: '0 1px 3px rgba(11,11,18,0.04)' }}
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div
          className="flex shrink-0 items-center justify-center rounded-full font-display font-bold text-white"
          style={{
            width: 40,
            height: 40,
            fontSize: 14,
            background: user.isActive ? 'var(--tropical-magenta)' : 'var(--ink-400)',
          }}
        >
          {initials(user.fullName)}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display font-semibold text-ink-1000" style={{ fontSize: 15 }}>
              {user.fullName}
            </span>
            <RoleBadge role={user.role} />
            {!user.isActive && (
              <span
                className="inline-flex items-center rounded-full bg-ink-100 px-2 py-0.5 font-mono font-semibold uppercase text-ink-500"
                style={{ fontSize: 10, letterSpacing: '0.1em' }}
              >
                Inactive
              </span>
            )}
          </div>
          <p className="font-mono text-ink-500 truncate" style={{ fontSize: 12 }}>
            {user.email}
          </p>
          {managerName && (
            <p className="font-mono text-ink-400" style={{ fontSize: 11 }}>
              Reports to: {managerName}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={onEdit}
            className="rounded-lg border border-ink-200 px-3 py-1.5 text-ink-700 text-sm transition-colors hover:bg-ink-50"
          >
            Edit
          </button>
          {user.isActive ? (
            <button
              onClick={onDeactivate}
              disabled={isDeactivating}
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-red-700 text-sm transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              {isDeactivating ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <UserX size={13} />
              )}
              Deactivate
            </button>
          ) : (
            <button
              onClick={onReactivate}
              disabled={isReactivating}
              className="inline-flex items-center gap-1 rounded-lg border border-green-200 px-3 py-1.5 text-green-700 text-sm transition-colors hover:bg-green-50 disabled:opacity-50"
            >
              {isReactivating ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <UserCheck size={13} />
              )}
              Reactivate
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Edit form ─────────────────────────────────────────────────────

type EditValues = z.infer<typeof UpdateUserBodySchema>

function EditUserPanel({
  user,
  managers,
  onClose,
}: {
  user: UserDetail
  managers: UserDetail[]
  onClose: () => void
}) {
  const updateUser = useUpdateUser()
  const form = useForm<EditValues>({
    resolver: zodResolver(UpdateUserBodySchema),
    defaultValues: {
      fullName: user.fullName,
      role: user.role,
      managerId: user.managerId ?? undefined,
    },
  })

  const onSubmit = async (values: EditValues) => {
    await updateUser.mutateAsync({ id: user.id, body: values })
    onClose()
  }

  const inputClass =
    'field-input w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-ink-1000 text-sm outline-none transition-colors placeholder:text-ink-400 focus:border-tropical-magenta focus:ring-2 focus:ring-tropical-magenta/20'

  return (
    <div
      className="rounded-2xl border border-ink-200 bg-ink-50 px-5 py-5"
      style={{ boxShadow: '0 1px 3px rgba(11,11,18,0.04)' }}
    >
      <h3 className="mb-4 font-display font-bold text-ink-1000" style={{ fontSize: 15 }}>
        Edit {user.fullName}
      </h3>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
        <div>
          <label className="mb-1 block font-mono text-ink-500 uppercase" style={{ fontSize: 11, letterSpacing: '0.1em' }}>
            Full name
          </label>
          <input type="text" {...form.register('fullName')} className={inputClass} />
          {form.formState.errors.fullName && (
            <p className="mt-1 text-red-600 text-xs">{form.formState.errors.fullName.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block font-mono text-ink-500 uppercase" style={{ fontSize: 11, letterSpacing: '0.1em' }}>
            Role
          </label>
          <select {...form.register('role')} className={inputClass}>
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block font-mono text-ink-500 uppercase" style={{ fontSize: 11, letterSpacing: '0.1em' }}>
            Manager
          </label>
          <select {...form.register('managerId')} className={inputClass}>
            <option value="">None</option>
            {managers
              .filter((m) => m.id !== user.id && m.role === 'manager' && m.isActive)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName}
                </option>
              ))}
          </select>
        </div>
        {updateUser.error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-red-700 text-sm">
            {updateUser.error.message}
          </p>
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-tropical-magenta px-4 py-2.5 font-semibold text-white text-sm transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {form.formState.isSubmitting && <Loader2 size={14} className="animate-spin" />}
            Save
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-ink-200 px-4 py-2.5 text-ink-700 text-sm transition-colors hover:bg-white"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Create user form ──────────────────────────────────────────────

function CreateUserPanel({
  managers,
  onClose,
}: {
  managers: UserDetail[]
  onClose: () => void
}) {
  const createUser = useCreateUser()
  const form = useForm<CreateFormValues>({
    resolver: zodResolver(CreateFormSchema),
    defaultValues: { role: 'employee' },
  })

  const onSubmit = async (values: CreateFormValues) => {
    await createUser.mutateAsync(values as CreateUserBody)
    onClose()
  }

  const inputClass =
    'field-input w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-ink-1000 text-sm outline-none transition-colors placeholder:text-ink-400 focus:border-tropical-magenta focus:ring-2 focus:ring-tropical-magenta/20'

  return (
    <div
      className="rounded-2xl border border-tropical-magenta/30 bg-tropical-magenta/5 px-5 py-5"
    >
      <h3 className="mb-4 font-display font-bold text-ink-1000" style={{ fontSize: 15 }}>
        Add team member
      </h3>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
        <div>
          <label className="mb-1 block font-mono text-ink-500 uppercase" style={{ fontSize: 11, letterSpacing: '0.1em' }}>
            Email
          </label>
          <input
            type="email"
            placeholder="name@calcey.com"
            {...form.register('email')}
            className={inputClass}
          />
          {form.formState.errors.email && (
            <p className="mt-1 text-red-600 text-xs">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block font-mono text-ink-500 uppercase" style={{ fontSize: 11, letterSpacing: '0.1em' }}>
            Full name
          </label>
          <input type="text" {...form.register('fullName')} className={inputClass} />
          {form.formState.errors.fullName && (
            <p className="mt-1 text-red-600 text-xs">{form.formState.errors.fullName.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block font-mono text-ink-500 uppercase" style={{ fontSize: 11, letterSpacing: '0.1em' }}>
            Role
          </label>
          <select {...form.register('role')} className={inputClass}>
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block font-mono text-ink-500 uppercase" style={{ fontSize: 11, letterSpacing: '0.1em' }}>
            Manager (optional)
          </label>
          <select {...form.register('managerId')} className={inputClass}>
            <option value="">None</option>
            {managers
              .filter((m) => m.role === 'manager' && m.isActive)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName}
                </option>
              ))}
          </select>
        </div>
        {createUser.error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-red-700 text-sm">
            {createUser.error.message}
          </p>
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-tropical-magenta px-4 py-2.5 font-semibold text-white text-sm transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {form.formState.isSubmitting && <Loader2 size={14} className="animate-spin" />}
            Add member
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-ink-200 px-4 py-2.5 text-ink-700 text-sm transition-colors hover:bg-white"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────

export function TeamPage() {
  const { data: users = [], isLoading } = useTeamUsers()
  const deactivate = useDeactivateUser()
  const reactivate = useReactivateUser()

  const [editingUser, setEditingUser] = useState<UserDetail | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const userMap = new Map(users.map((u) => [u.id, u]))

  const active = users.filter((u) => u.isActive)
  const inactive = users.filter((u) => !u.isActive)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-ink-1000" style={{ fontSize: 22, letterSpacing: '-0.01em' }}>
            Team
          </h1>
          <p className="font-mono text-ink-500" style={{ fontSize: 12 }}>
            {active.length} active · {inactive.length} inactive
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setEditingUser(null) }}
          className="inline-flex items-center gap-2 rounded-xl bg-tropical-magenta px-4 py-2.5 font-semibold text-white text-sm transition-colors hover:opacity-90"
        >
          <Plus size={15} />
          Add member
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <CreateUserPanel
          managers={users}
          onClose={() => setShowCreate(false)}
        />
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-ink-400">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {users.length === 0 && (
            <div className="rounded-2xl border border-dashed border-ink-200 py-12 text-center">
              <p className="text-ink-400 text-sm">No team members yet</p>
            </div>
          )}

          {users.map((user) => (
            <div key={user.id}>
              {editingUser?.id === user.id ? (
                <EditUserPanel
                  user={user}
                  managers={users}
                  onClose={() => setEditingUser(null)}
                />
              ) : (
                <UserCard
                  user={user}
                  managerName={user.managerId ? (userMap.get(user.managerId)?.fullName ?? null) : null}
                  onEdit={() => { setEditingUser(user); setShowCreate(false) }}
                  onDeactivate={() => deactivate.mutate(user.id)}
                  onReactivate={() => reactivate.mutate(user.id)}
                  isDeactivating={deactivate.isPending && deactivate.variables === user.id}
                  isReactivating={reactivate.isPending && reactivate.variables === user.id}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
