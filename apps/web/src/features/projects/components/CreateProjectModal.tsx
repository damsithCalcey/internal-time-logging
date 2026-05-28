import { zodResolver } from '@hookform/resolvers/zod'
import type { CreateProjectBody } from '@repo/shared-types'
import { CreateProjectBodySchema } from '@repo/shared-types'
import { X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useCreateProject } from '../hooks'

export function CreateProjectModal({ onClose }: { onClose: () => void }) {
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
