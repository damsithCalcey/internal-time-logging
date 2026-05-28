import { projectsApi } from '@/features/projects/api'
import { zodResolver } from '@hookform/resolvers/zod'
import type { LogEntry } from '@repo/shared-types'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Loader2, X } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useDailyUpdateEntry } from '../hooks'

const INPUT_CLASS =
  'field-input w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-ink-1000 text-sm outline-none transition-colors placeholder:text-ink-400 focus:border-tropical-magenta focus:ring-2 focus:ring-tropical-magenta/20'

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

export function EditModal({ entry, onClose }: { entry: LogEntry; onClose: () => void }) {
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

  const {
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = form
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
            <label
              className="text-ink-500 mb-1 block font-mono uppercase"
              style={{ fontSize: 11, letterSpacing: '0.1em' }}
            >
              Project
            </label>
            <select {...form.register('projectId')} className={INPUT_CLASS}>
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
              className={`${INPUT_CLASS} disabled:bg-ink-50 disabled:text-ink-400 disabled:cursor-not-allowed`}
            >
              <option value="">Select task…</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {errors.taskId && <p className="mt-1 text-xs text-red-600">{errors.taskId.message}</p>}
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
              className={INPUT_CLASS}
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
              className={INPUT_CLASS}
            />
            {errors.hours && <p className="mt-1 text-xs text-red-600">{errors.hours.message}</p>}
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
