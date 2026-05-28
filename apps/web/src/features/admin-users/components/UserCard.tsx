import type { UserDetail } from '@repo/shared-types'
import { Loader2, UserCheck, UserX } from 'lucide-react'
import { RoleBadge } from './RoleBadge'

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
}

export function UserCard({
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
