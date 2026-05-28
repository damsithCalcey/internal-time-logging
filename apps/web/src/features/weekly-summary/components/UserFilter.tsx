export function UserFilter({
  userFilter,
  onUserFilterChange,
  activeUsers,
}: {
  userFilter: string
  onUserFilterChange: (userId: string) => void
  activeUsers: Array<{ id: string; fullName: string }>
}) {
  return (
    <div className="flex items-center gap-3">
      <label
        className="text-ink-400 shrink-0 font-mono uppercase"
        style={{ fontSize: 11, letterSpacing: '0.1em' }}
      >
        Employee
      </label>
      <select
        value={userFilter}
        onChange={(e) => onUserFilterChange(e.target.value)}
        className="border-ink-200 text-ink-1000 focus:border-tropical-magenta focus:ring-tropical-magenta/20 rounded-xl border bg-white px-3 py-1.5 text-sm transition-colors outline-none focus:ring-2"
      >
        <option value="">All employees</option>
        {activeUsers.map((u) => (
          <option key={u.id} value={u.id}>
            {u.fullName}
          </option>
        ))}
      </select>
    </div>
  )
}
