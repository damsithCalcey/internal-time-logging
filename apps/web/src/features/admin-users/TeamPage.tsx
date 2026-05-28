import type { UserDetail } from '@repo/shared-types'
import { Loader2, Plus } from 'lucide-react'
import { useState } from 'react'
import { CreateUserPanel } from './components/CreateUserPanel'
import { EditUserPanel } from './components/EditUserPanel'
import { UserCard } from './components/UserCard'
import {
  useDeactivateUser,
  useReactivateUser,
  useTeamUsers,
} from './hooks'

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
