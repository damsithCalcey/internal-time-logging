import { Filter } from 'lucide-react'
import { STATUS_OPTIONS } from '../constants'

interface FilterBarProps {
  statusFilter: string
  onStatusChange: (status: string) => void
  userFilter: string
  onUserChange: (userId: string) => void
  fromFilter: string
  onFromChange: (from: string) => void
  toFilter: string
  onToChange: (to: string) => void
  activeUsers: Array<{ id: string; fullName: string }>
  onClearFilters: () => void
}

export function FilterBar({
  statusFilter,
  onStatusChange,
  userFilter,
  onUserChange,
  fromFilter,
  onFromChange,
  toFilter,
  onToChange,
  activeUsers,
  onClearFilters,
}: FilterBarProps) {
  const inputClass =
    'field-input rounded-xl border border-ink-200 bg-white px-3 py-2 text-ink-1000 text-sm outline-none transition-colors placeholder:text-ink-400 focus:border-tropical-magenta focus:ring-2 focus:ring-tropical-magenta/20'

  return (
    <div
      className="border-ink-200 flex flex-wrap items-end gap-3 rounded-2xl border bg-white px-5 py-4"
      style={{ boxShadow: '0 1px 3px rgba(11,11,18,0.04)' }}
    >
      <Filter size={14} className="text-ink-400 mb-2.5 shrink-0" />

      {/* Status */}
      <div className="flex flex-col gap-1">
        <label className="text-ink-400 font-mono uppercase" style={{ fontSize: 10, letterSpacing: '0.1em' }}>
          Status
        </label>
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className={inputClass}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* User */}
      <div className="flex flex-col gap-1">
        <label className="text-ink-400 font-mono uppercase" style={{ fontSize: 10, letterSpacing: '0.1em' }}>
          Employee
        </label>
        <select
          value={userFilter}
          onChange={(e) => onUserChange(e.target.value)}
          className={inputClass}
        >
          <option value="">All employees</option>
          {activeUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.fullName}
            </option>
          ))}
        </select>
      </div>

      {/* Date from */}
      <div className="flex flex-col gap-1">
        <label className="text-ink-400 font-mono uppercase" style={{ fontSize: 10, letterSpacing: '0.1em' }}>
          From
        </label>
        <input
          type="date"
          value={fromFilter}
          onChange={(e) => onFromChange(e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Date to */}
      <div className="flex flex-col gap-1">
        <label className="text-ink-400 font-mono uppercase" style={{ fontSize: 10, letterSpacing: '0.1em' }}>
          To
        </label>
        <input
          type="date"
          value={toFilter}
          onChange={(e) => onToChange(e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Clear filters */}
      {(userFilter || fromFilter || toFilter) && (
        <button
          onClick={onClearFilters}
          className="border-ink-200 text-ink-500 hover:bg-ink-50 mb-0.5 self-end rounded-xl border px-3 py-2 text-sm transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  )
}
