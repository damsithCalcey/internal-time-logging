import { useAuth } from '@/features/auth/AuthProvider'
import { projectsApi, usersApi } from '@/features/projects/api'
import { zodResolver } from '@hookform/resolvers/zod'
import type { TimeEntry } from '@repo/shared-types'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Pencil,
  SendHorizonal,
  Undo2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { StatusBadge } from '@/shared/StatusBadge'
import {
  useCreateTimeEntry,
  useSubmitEntry,
  useTimeEntries,
  useUpdateTimeEntry,
  useWithdrawEntry,
} from './hooks'

// ── Form schema ───────────────────────────────────────────────────

const FormSchema = z.object({
  onBehalfOf: z.string().optional(),
  projectId: z.string().min(1, 'Select a project'),
  taskId: z.string().min(1, 'Select a task'),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Required'),
  hours: z
    .number({ invalid_type_error: 'Enter hours' })
    .positive('Must be positive')
    .max(24, 'Max 24h')
    .refine((h) => Math.floor(h * 2) === h * 2, 'Use 0.5 increments'),
  notes: z.string().optional(),
})
type FormValues = z.infer<typeof FormSchema>

// ── Entry card ────────────────────────────────────────────────────

function EntryCard({
  entry,
  projectName,
  taskName,
  onEdit,
  onSubmit,
  onWithdraw,
  isSubmitting,
  isWithdrawing,
  currentUserId,
}: {
  entry: TimeEntry
  projectName: string
  taskName: string
  onEdit: () => void
  onSubmit: () => void
  onWithdraw: () => void
  isSubmitting: boolean
  isWithdrawing: boolean
  currentUserId: string
}) {
  const isOwn = entry.userId === currentUserId
  const canEdit = isOwn && ['draft', 'rejected'].includes(entry.status)
  const canSubmit = isOwn && entry.status === 'draft'
  const canWithdraw = isOwn && entry.status === 'submitted'

  return (
    <div
      className="border-ink-200 rounded-2xl border bg-white px-5 py-4"
      style={{ boxShadow: '0 1px 3px rgba(11,11,18,0.04)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-display text-ink-1000 truncate font-semibold" style={{ fontSize: 15 }}>
            {projectName}
          </p>
          <p className="text-ink-500 font-mono" style={{ fontSize: 12 }}>
            {taskName}
          </p>
          {entry.notes && (
            <p className="text-ink-600 mt-1 line-clamp-2" style={{ fontSize: 13 }}>
              {entry.notes}
            </p>
          )}
          {entry.managerNote && (
            <p className="mt-1 text-xs text-red-600 italic">{entry.managerNote}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex items-center gap-1">
            <Clock size={13} className="text-ink-400" />
            <span className="text-ink-1000 font-mono font-semibold" style={{ fontSize: 15 }}>
              {entry.hours}h
            </span>
          </div>
          <StatusBadge status={entry.status} />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {canEdit && (
          <button
            onClick={onEdit}
            className="border-ink-200 text-ink-700 hover:bg-ink-50 hover:text-ink-1000 inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 transition-colors"
            style={{ fontSize: 13 }}
          >
            <Pencil size={13} />
            Edit
          </button>
        )}
        {canSubmit && (
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="bg-ink-1000 hover:bg-ink-800 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-white transition-colors disabled:opacity-50"
            style={{ fontSize: 13 }}
          >
            {isSubmitting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <SendHorizonal size={13} />
            )}
            Submit
          </button>
        )}
        {canWithdraw && (
          <button
            onClick={onWithdraw}
            disabled={isWithdrawing}
            className="border-ink-200 text-ink-700 hover:bg-ink-50 inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 transition-colors disabled:opacity-50"
            style={{ fontSize: 13 }}
          >
            {isWithdrawing ? <Loader2 size={13} className="animate-spin" /> : <Undo2 size={13} />}
            Withdraw
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────

export function TimeEntriesPage() {
  const { user } = useAuth()
  const isManager = user?.role === 'manager'
  const today = format(new Date(), 'yyyy-MM-dd')

  const [selectedDate, setSelectedDate] = useState(today)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      projectId: '',
      taskId: '',
      entryDate: today,
      hours: 1,
      notes: '',
    },
  })

  const {
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting: formSubmitting },
  } = form
  const selectedProjectId = watch('projectId')

  // Load projects for dropdown
  const { data: projects = [] } = useQuery({
    queryKey: ['projects', 'for-time-entry'],
    queryFn: () => projectsApi.listForTimeEntry(),
    staleTime: 60_000,
  })

  // Manager: load active users for "on behalf of" dropdown
  const { data: activeUsers = [] } = useQuery({
    queryKey: ['users', 'active'],
    queryFn: usersApi.listActive,
    enabled: isManager,
    staleTime: 60_000,
  })

  const { data: entries = [], isLoading: entriesLoading } = useTimeEntries(selectedDate)

  const createEntry = useCreateTimeEntry()
  const updateEntry = useUpdateTimeEntry()
  const submitEntry = useSubmitEntry()
  const withdrawEntry = useWithdrawEntry()

  // Project-to-task map
  const selectedProject = projects.find((p) => p.id === selectedProjectId)
  const tasks = selectedProject?.tasks ?? []

  // Clear task when project changes
  useEffect(() => {
    setValue('taskId', '')
  }, [selectedProjectId, setValue])

  // Sync form when editing entry changes; clear stale mutation errors
  useEffect(() => {
    createEntry.reset()
    updateEntry.reset()
    submitEntry.reset()
    withdrawEntry.reset()
    if (editingEntry) {
      reset({
        projectId: editingEntry.projectId,
        taskId: editingEntry.taskId,
        entryDate: editingEntry.entryDate,
        hours: editingEntry.hours,
        notes: editingEntry.notes ?? '',
      })
    } else {
      reset({ projectId: '', taskId: '', entryDate: selectedDate, hours: 1, notes: '' })
    }
  }, [editingEntry, selectedDate, reset])

  const onSubmit = async (values: FormValues) => {
    try {
      if (editingEntry) {
        await updateEntry.mutateAsync({
          id: editingEntry.id,
          body: {
            projectId: values.projectId,
            taskId: values.taskId,
            entryDate: values.entryDate,
            hours: values.hours,
            notes: values.notes || null,
          },
        })
        setEditingEntry(null)
      } else {
        await createEntry.mutateAsync({
          ...(isManager && values.onBehalfOf ? { userId: values.onBehalfOf } : {}),
          projectId: values.projectId,
          taskId: values.taskId,
          entryDate: values.entryDate,
          hours: values.hours,
          notes: values.notes || null,
        })
        reset({ projectId: '', taskId: '', entryDate: selectedDate, hours: 1, notes: '' })
      }
    } catch {
      // Error surfaced via mutation state
    }
  }

  const mutationError =
    createEntry.error ?? updateEntry.error ?? submitEntry.error ?? withdrawEntry.error

  // Date navigation
  const navigateDate = (delta: number) => {
    const d = new Date(`${selectedDate}T00:00:00`)
    d.setDate(d.getDate() + delta)
    const next = format(d, 'yyyy-MM-dd')
    if (next <= today) setSelectedDate(next)
  }

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0)

  // Build project/task name maps for entry cards
  const projectMap = new Map(projects.map((p) => [p.id, p.name]))
  const taskMap = new Map(projects.flatMap((p) => p.tasks.map((t) => [t.id, t.name])))

  const inputClass =
    'field-input w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-ink-1000 text-sm outline-none transition-colors placeholder:text-ink-400 focus:border-tropical-magenta focus:ring-2 focus:ring-tropical-magenta/20'

  return (
    <div className="flex flex-col gap-6">
      {/* Date navigator */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigateDate(-1)}
          className="border-ink-200 text-ink-600 hover:bg-ink-50 rounded-xl border p-2 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex flex-col">
          <span className="font-display text-ink-1000 font-bold" style={{ fontSize: 18 }}>
            {format(new Date(`${selectedDate}T00:00:00`), 'EEEE, MMM d')}
          </span>
          {totalHours > 0 && (
            <span className="text-ink-500 font-mono" style={{ fontSize: 12 }}>
              {totalHours}h logged
            </span>
          )}
        </div>
        <button
          onClick={() => navigateDate(1)}
          disabled={selectedDate >= today}
          className="border-ink-200 text-ink-600 hover:bg-ink-50 rounded-xl border p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
        {selectedDate !== today && (
          <button
            onClick={() => setSelectedDate(today)}
            className="border-ink-200 text-ink-600 hover:bg-ink-50 ml-1 rounded-xl border px-3 py-1.5 text-sm transition-colors"
          >
            Today
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* ── Log time form ─── */}
        <div className="lg:col-span-2">
          <div
            className="border-ink-200 rounded-2xl border bg-white px-6 py-5"
            style={{ boxShadow: '0 1px 3px rgba(11,11,18,0.04)' }}
          >
            <h2 className="font-display text-ink-1000 mb-4 font-bold" style={{ fontSize: 16 }}>
              {editingEntry ? 'Edit entry' : 'Log time'}
            </h2>

            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
              {/* Manager: on behalf of */}
              {isManager && !editingEntry && (
                <div>
                  <label
                    className="text-ink-500 mb-1 block font-mono uppercase"
                    style={{ fontSize: 11, letterSpacing: '0.1em' }}
                  >
                    On behalf of
                  </label>
                  <select {...form.register('onBehalfOf')} className={inputClass}>
                    <option value="">Myself</option>
                    {activeUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Project */}
              <div>
                <label
                  className="text-ink-500 mb-1 block font-mono uppercase"
                  style={{ fontSize: 11, letterSpacing: '0.1em' }}
                >
                  Project
                </label>
                <select {...form.register('projectId')} className={inputClass}>
                  <option value="">Select project…</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {errors.projectId && (
                  <p className="mt-1 text-xs text-red-600">{errors.projectId.message}</p>
                )}
              </div>

              {/* Task */}
              <div>
                <label
                  className="text-ink-500 mb-1 block font-mono uppercase"
                  style={{ fontSize: 11, letterSpacing: '0.1em' }}
                >
                  Task
                </label>
                <select
                  {...form.register('taskId')}
                  disabled={!selectedProjectId}
                  className={`${inputClass} disabled:bg-ink-50 disabled:text-ink-400 disabled:cursor-not-allowed`}
                >
                  <option value="">Select task…</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {errors.taskId && (
                  <p className="mt-1 text-xs text-red-600">{errors.taskId.message}</p>
                )}
              </div>

              {/* Date */}
              <div>
                <label
                  className="text-ink-500 mb-1 block font-mono uppercase"
                  style={{ fontSize: 11, letterSpacing: '0.1em' }}
                >
                  Date
                </label>
                <input
                  type="date"
                  max={today}
                  {...form.register('entryDate')}
                  className={inputClass}
                />
                {errors.entryDate && (
                  <p className="mt-1 text-xs text-red-600">{errors.entryDate.message}</p>
                )}
              </div>

              {/* Hours */}
              <div>
                <label
                  className="text-ink-500 mb-1 block font-mono uppercase"
                  style={{ fontSize: 11, letterSpacing: '0.1em' }}
                >
                  Hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  {...form.register('hours', { valueAsNumber: true })}
                  className={inputClass}
                />
                {errors.hours && (
                  <p className="mt-1 text-xs text-red-600">{errors.hours.message}</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label
                  className="text-ink-500 mb-1 block font-mono uppercase"
                  style={{ fontSize: 11, letterSpacing: '0.1em' }}
                >
                  Notes
                </label>
                <textarea
                  rows={3}
                  {...form.register('notes')}
                  placeholder="Optional"
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* API error */}
              {mutationError && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                  {mutationError.message}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="bg-tropical-magenta flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
                  style={{ fontSize: 14 }}
                >
                  {formSubmitting && <Loader2 size={15} className="animate-spin" />}
                  {editingEntry ? 'Save changes' : 'Log entry'}
                </button>
                {editingEntry && (
                  <button
                    type="button"
                    onClick={() => setEditingEntry(null)}
                    className="border-ink-200 text-ink-700 hover:bg-ink-50 rounded-xl border px-4 py-2.5 text-sm transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* ── Entry list ─── */}
        <div className="flex flex-col gap-3 lg:col-span-3">
          {entriesLoading ? (
            <div className="text-ink-400 flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="border-ink-200 rounded-2xl border border-dashed py-12 text-center">
              <p className="text-ink-400 text-sm">No entries for this day</p>
            </div>
          ) : (
            <>
              {entries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  projectName={projectMap.get(entry.projectId) ?? entry.projectId}
                  taskName={taskMap.get(entry.taskId) ?? entry.taskId}
                  currentUserId={user?.id ?? ''}
                  onEdit={() => setEditingEntry(entry)}
                  onSubmit={() => submitEntry.mutate(entry.id)}
                  onWithdraw={() => withdrawEntry.mutate(entry.id)}
                  isSubmitting={submitEntry.isPending && submitEntry.variables === entry.id}
                  isWithdrawing={withdrawEntry.isPending && withdrawEntry.variables === entry.id}
                />
              ))}
              {totalHours > 0 && (
                <div className="flex justify-end px-1">
                  <span className="text-ink-600 font-mono font-semibold" style={{ fontSize: 13 }}>
                    Total: {totalHours}h
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
