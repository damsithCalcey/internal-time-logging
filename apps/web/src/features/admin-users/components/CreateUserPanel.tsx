import { zodResolver } from '@hookform/resolvers/zod'
import type { CreateUserBody, UserDetail } from '@repo/shared-types'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useCreateUser } from '../hooks'

const CreateFormSchema = z.object({
  email: z.string().email('Invalid email').trim(),
  fullName: z.string().min(1, 'Full name is required').max(200).trim(),
  role: z.enum(['manager', 'employee']),
  managerId: z.string().uuid().nullable().optional(),
})
type CreateFormValues = z.infer<typeof CreateFormSchema>

const inputClass =
  'field-input w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-ink-1000 text-sm outline-none transition-colors placeholder:text-ink-400 focus:border-tropical-magenta focus:ring-2 focus:ring-tropical-magenta/20'

export function CreateUserPanel({
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
