import { useAuth } from '@/features/auth/AuthProvider'
import { projectsApi, usersApi } from '@/features/projects/api'
import { zodResolver } from '@hookform/resolvers/zod'
import type { LogEntry } from '@repo/shared-types'
import { useQuery } from '@tanstack/react-query'
import {
  addDays,
  format,
  subDays,
} from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  SendHorizonal,
  Undo2,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useDailyLog, useDailySubmit, useDailyUpdateEntry, useDailyWithdraw } from './hooks'

// ── Shared styles ─────────────────────────────────────────────────

const INPUT_CLASS =
  'field-input w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-ink-1000 text-sm outline-none transition-colors placeholder:text-ink-400 focus:border-tropical-magenta focus:ring-2 focus:ring-tropical-magenta/20'

// ── Status badge ──────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { label: string; bg: string; text: string }> = {
  draft: { label: 'Draft', bg: 'bg-ink-100', text: 'text-ink-600' },
  submitted: { label: 'Submitted', bg: 'bg-blue-50', text: 'text-blue-700' },
  approved: { label: 'Approved', bg: 'bg-green-50', text: 'text-green-700' },
  rejected: { label: 'Rejected', bg: 'bg-red-50', text: 'text-red-700' },
  amended: { label: 'Amended', bg: 'bg-amber-50', text: 'text-amber-700' },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE['draft']!
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono font-semibold uppercase ${s.bg} ${s.text}`}
      style={{ fontSize: 10, letterSpacing: '0.1em' }}
    >
      {s.label}
    </span>
  )
}

// ── Edit form schema ──────────────────────────────────────────────

const EditSchema = z.object({
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
type EditValues = z.infer<typeof EditSchema>

// ── Quick-edit modal ──────────────────────────────────────────────

function EditModal({ entry, onClose }: { entry: LogEntry; onClose: () => void }) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const updateEntry = useDailyUpdateEntry()

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', 'for-time-entry'],
    queryFn: () => projectsApi.listForTimeEntry(),
    staleTime: 60_000,
  })

  const form = useForm<EditValues>({
    resolver: zodResolver(EditSchema),
    defaultValues: {
      projectId: entry.projectId,
      taskId: entry.taskId,
      entryDate: entry.entryDate,
      hours: entry.hours,
      notes: entry.notes ?? '',
    },
  })

  const { watch, setValue, formState: { errors, isSubmitting } } = form
  const selectedProjectId = watch('projectId')

  useEffect(() => {
    if (selectedProjectId !== entry.projectId) {
      setValue('taskId', '')
    }
  }, [selectedProjectId, entry.projectId, setValue])

  const selectedProject = projects.find((p) => p.id === selectedProjectId)
  const tasks = selectedProject?.tasks ?? []

  const onSubmit = async (values: EditValues) => {
    try {
      await updateEntry.mutateAsync({
        id: entry.id,
        body: {
          projectId: values.projectId,
          taskId: values.taskId,
          entryDate: values.entryDate,
          hours: values.hours,
          notes: values.notes || null,
        },
      })
      onClose()
    } catch {
      // error shown via mutation state
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="border-ink-200 w-full max-w-md rounded-2xl border bg-white p-6"
        style={{ boxShadow: '0 8px 32px rgba(11,11,18,0.16)' }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-ink-1000 font-bold" style={{ fontSize: 16 }}>
            Edit entry
          </h3>
          <button
            onClick={onClose}
            className="text-ink-400 hover:text-ink-700 rounded-lg p-1 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
          {/* Project */}
          <div>
            <label className="text-ink-500 mb-1 block font-mono uppercase" style={{ fontSize: 11, letterSpacing: '0.1em' }}>
              Project
            </label>
            <select {...form.register('projectId')} className={INPUT_CLASS}>
              <option value="">Select project…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {errors.projectId && <p className="mt-1 text-xs text-red-600">{errors.projectId.message}</p>}
          </div>

          {/* Task */}
          <div>
            <label className="text-ink-500 mb-1 block font-mono uppercase" style={{ fontSize: 11, letterSpacing: '0.1em' }}>
              Task
            </label>
            <select
              {...form.register('taskId')}
              disabled={!selectedProjectId}
              className={`${INPUT_CLASS} disabled:bg-ink-50 disabled:text-ink-400 disabled:cursor-not-allowed`}
            >
              <option value="">Select task…</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {errors.taskId && <p className="mt-1 text-xs text-red-600">{errors.taskId.message}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="text-ink-500 mb-1 block font-mono uppercase" style={{ fontSize: 11, letterSpacing: '0.1em' }}>
              Date
            </label>
            <input type="date" max={today} {...form.register('entryDate')} className={INPUT_CLASS} />
            {errors.entryDate && <p className="mt-1 text-xs text-red-600">{errors.entryDate.message}</p>}
          </div>

          {/* Hours */}
          <div>
            <label className="text-ink-500 mb-1 block font-mono uppercase" style={{ fontSize: 11, letterSpacing: '0.1em' }}>
              Hours
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="24"
              {...form.register('hours', { valueAsNumber: true })}
              className={INPUT_CLASS}
            />
            {errors.hours && <p className="mt-1 text-xs text-red-600">{errors.hours.message}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="text-ink-500 mb-1 block font-mono uppercase" style={{ fontSize: 11, letterSpacing: '0.1em' }}>
              Notes
            </label>
            <textarea
              rows={3}
              {...form.register('notes')}
              placeholder="Optional"
              className={`${INPUT_CLASS} resize-none`}
            />
          </div>

          {updateEntry.error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {updateEntry.error.message}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-tropical-magenta flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ fontSize: 14 }}
            >
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              Save changes
            </button>
            <button
              type="button"
              onClick={onClose}
              className="border-ink-200 text-ink-700 hover:bg-ink-50 rounded-xl border px-4 py-2.5 text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────

export function DailyLogPage() {
  const { user } = useAuth()
  const isManager = user?.role === 'manager'
  const today = format(new Date(), 'yyyy-MM-dd')
  const navigate = useNavigate()

  const [selectedDate, setSelectedDate] = useState(today)
  const [userFilter, setUserFilter] = useState('')
  const [editingEntry, setEditingEntry] = useState<LogEntry | null>(null)

  const { data: entries = [], isLoading } = useDailyLog(
    selectedDate,
    isManager ? userFilter || undefined : undefined,
  )

  const { data: activeUsers = [] } = useQuery({
    queryKey: ['users', 'active'],
    queryFn: usersApi.listActive,
    enabled: isManager,
    staleTime: 60_000,
  })

  const submit = useDailySubmit()
  const withdraw = useDailyWithdraw()

  const navigateDate = (delta: number) => {
    const d = new Date(`${selectedDate}T00:00:00`)
    const next = format(delta > 0 ? addDays(d, delta) : subDays(d, -delta), 'yyyy-MM-dd')
    if (next <= today) setSelectedDate(next)
  }

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0)

  const dateLabel = format(new Date(`${selectedDate}T00:00:00`), 'EEEE, MMM d')

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Date navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateDate(-1)}
            className="border-ink-200 text-ink-600 hover:bg-ink-50 rounded-xl border p-2 transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex flex-col">
            <span className="font-display text-ink-1000 font-bold" style={{ fontSize: 18 }}>
              {dateLabel}
            </span>
            {!isLoading && totalHours > 0 && (
              <span className="text-ink-500 font-mono" style={{ fontSize: 12 }}>
                {totalHours}h logged
              </span>
            )}
          </div>
          <button
            onClick={() => navigateDate(1)}
            disabled={selectedDate >= today}
            className="border-ink-200 text-ink-600 hover:bg-ink-50 rounded-xl border p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Next day"
          >
            <ChevronRight size={16} />
          </button>
          {selectedDate !== today && (
            <button
              onClick={() => setSelectedDate(today)}
              className="border-ink-200 text-ink-600 hover:bg-ink-50 rounded-xl border px-3 py-1.5 text-sm transition-colors"
            >
              Today
            </button>
          )}
        </div>

        {/* Log entry button */}
        <button
          onClick={() => navigate('/app/entries')}
          className="bg-tropical-magenta hover:opacity-90 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-white transition-colors"
          style={{ fontSize: 14 }}
        >
          <Plus size={16} />
          Log entry
        </button>
      </div>

      {/* Manager: user filter */}
      {isManager && (
        <div className="flex items-center gap-3">
          <label
            className="text-ink-400 shrink-0 font-mono uppercase"
            style={{ fontSize: 11, letterSpacing: '0.1em' }}
          >
            Employee
          </label>
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="border-ink-200 rounded-xl border bg-white px-3 py-1.5 text-sm text-ink-1000 outline-none transition-colors focus:border-tropical-magenta focus:ring-2 focus:ring-tropical-magenta/20"
          >
            <option value="">All employees</option>
            {activeUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.fullName}</option>
            ))}
          </select>
        </div>
      )}

      {/* Table */}
      <div
        className="border-ink-200 overflow-hidden rounded-2xl border bg-white"
        style={{ boxShadow: '0 1px 3px rgba(11,11,18,0.04)' }}
      >
        {isLoading ? (
          <div className="text-ink-400 flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="border-ink-100 flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-ink-400 text-sm">No entries for {dateLabel}</p>
            <button
              onClick={() => navigate('/app/entries')}
              className="bg-tropical-magenta hover:opacity-90 inline-flex items-center gap-2 rounded-xl px-4 py-2 font-semibold text-white transition-colors"
              style={{ fontSize: 13 }}
            >
              <Plus size={14} />
              Log entry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-ink-100 border-b">
                  {isManager && (
                    <th
                      className="text-ink-400 px-5 py-3 text-left font-mono uppercase"
                      style={{ fontSize: 11, letterSpacing: '0.1em' }}
                    >
                      Employee
                    </th>
                  )}
                  <th
                    className="text-ink-400 py-3 pr-4 text-left font-mono uppercase"
                    style={{ fontSize: 11, letterSpacing: '0.1em', paddingLeft: isManager ? 0 : 20 }}
                  >
                    Project / Task
                  </th>
                  <th
                    className="text-ink-400 py-3 pr-4 text-left font-mono uppercase"
                    style={{ fontSize: 11, letterSpacing: '0.1em' }}
                  >
                    Notes
                  </th>
                  <th
                    className="text-ink-400 py-3 pr-4 text-left font-mono uppercase"
                    style={{ fontSize: 11, letterSpacing: '0.1em' }}
                  >
                    Hours
                  </th>
                  <th
                    className="text-ink-400 py-3 pr-4 text-left font-mono uppercase"
                    style={{ fontSize: 11, letterSpacing: '0.1em' }}
                  >
                    Status
                  </th>
                  <th
                    className="text-ink-400 py-3 pr-5 text-left font-mono uppercase"
                    style={{ fontSize: 11, letterSpacing: '0.1em' }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="px-5">
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-ink-100 border-b last:border-b-0">
                    {isManager && (
                      <td
                        className="text-ink-700 py-3 pr-4 text-sm"
                        style={{ paddingLeft: 20 }}
                      >
                        {entry.userName}
                      </td>
                    )}
                    <td
                      className="py-3 pr-4"
                      style={{ paddingLeft: isManager ? 0 : 20 }}
                    >
                      <p className="text-ink-1000 font-semibold" style={{ fontSize: 14 }}>
                        {entry.projectName}
                      </p>
                      <p className="text-ink-500 font-mono" style={{ fontSize: 12 }}>
                        {entry.taskName}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      {entry.notes ? (
                        <p
                          className="text-ink-600 max-w-[200px] truncate"
                          style={{ fontSize: 13 }}
                          title={entry.notes}
                        >
                          {entry.notes}
                        </p>
                      ) : (
                        <span className="text-ink-300 text-sm">—</span>
                      )}
                      {entry.managerNote && (
                        <p
                          className="mt-0.5 max-w-[200px] truncate text-xs text-red-500 italic"
                          title={entry.managerNote}
                        >
                          {entry.managerNote}
                        </p>
                      )}
                      {entry.status === 'amended' && entry.originalHours != null && (
                        <p className="text-ink-400 mt-0.5 text-xs">
                          Amended · was {entry.originalHours}h
                        </p>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className="text-ink-1000 font-mono font-semibold"
                        style={{ fontSize: 14 }}
                      >
                        {entry.hours}h
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={entry.status} />
                    </td>
                    <td className="py-3 pr-5">
                      {(() => {
                        const isOwn = entry.userId === user?.id
                        const canEdit = isOwn && ['draft', 'rejected'].includes(entry.status)
                        const canSubmit = isOwn && entry.status === 'draft'
                        const canWithdraw = isOwn && entry.status === 'submitted'
                        return (
                          <div className="flex items-center gap-1.5">
                            {canEdit && (
                              <button
                                onClick={() => setEditingEntry(entry)}
                                className="border-ink-200 text-ink-600 hover:bg-ink-50 hover:text-ink-1000 inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 transition-colors"
                                style={{ fontSize: 12 }}
                              >
                                <Pencil size={12} />
                                Edit
                              </button>
                            )}
                            {canSubmit && (
                              <button
                                onClick={() => submit.mutate(entry.id)}
                                disabled={submit.isPending && submit.variables === entry.id}
                                className="bg-ink-1000 hover:bg-ink-800 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-white transition-colors disabled:opacity-50"
                                style={{ fontSize: 12 }}
                              >
                                {submit.isPending && submit.variables === entry.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <SendHorizonal size={12} />
                                )}
                                Submit
                              </button>
                            )}
                            {canWithdraw && (
                              <button
                                onClick={() => withdraw.mutate(entry.id)}
                                disabled={withdraw.isPending && withdraw.variables === entry.id}
                                className="border-ink-200 text-ink-600 hover:bg-ink-50 inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 transition-colors disabled:opacity-50"
                                style={{ fontSize: 12 }}
                              >
                                {withdraw.isPending && withdraw.variables === entry.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Undo2 size={12} />
                                )}
                                Withdraw
                              </button>
                            )}
                          </div>
                        )
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Total footer */}
              <tfoot>
                <tr className="border-ink-100 border-t bg-ink-50">
                  <td
                    colSpan={isManager ? 3 : 2}
                    className="px-5 py-3 text-right"
                  />
                  <td className="py-3 pr-4">
                    <span className="text-ink-1000 font-mono font-bold" style={{ fontSize: 14 }}>
                      {totalHours}h
                    </span>
                  </td>
                  <td colSpan={2} className="py-3 pr-5">
                    <span
                      className="text-ink-400 font-mono uppercase"
                      style={{ fontSize: 10, letterSpacing: '0.1em' }}
                    >
                      Total
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editingEntry && (
        <EditModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </div>
  )
}
