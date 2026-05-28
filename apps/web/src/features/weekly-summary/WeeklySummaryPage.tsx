import { useAuth } from '@/features/auth/AuthProvider'
import { usersApi } from '@/features/projects/api'
import type { LogEntry } from '@repo/shared-types'
import { useQuery } from '@tanstack/react-query'
import { addWeeks, format, getISOWeek, getISOWeekYear, startOfISOWeek, subWeeks } from 'date-fns'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useWeeklySummary } from './hooks'

// ── ISO week helpers ──────────────────────────────────────────────

function toWeekStr(date: Date): string {
  return `${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, '0')}`
}

function getWeekDates(weekStr: string): string[] {
  // Derive a Monday from the week string, then return all 7 days
  const match = /^(\d{4})-W(\d{2})$/.exec(weekStr)
  if (!match) return []
  const year = parseInt(match[1]!, 10)
  const weekNum = parseInt(match[2]!, 10)
  const jan4 = new Date(year, 0, 4)
  const jan4Day = (jan4.getDay() + 6) % 7
  const monday = new Date(year, 0, 4 - jan4Day + (weekNum - 1) * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

function formatWeekHeader(weekStr: string): string {
  const dates = getWeekDates(weekStr)
  if (dates.length < 7) return weekStr
  const mon = new Date(`${dates[0]}T00:00:00`)
  const sun = new Date(`${dates[6]}T00:00:00`)
  const weekNum = getISOWeek(mon)
  if (mon.getMonth() === sun.getMonth()) {
    return `W${weekNum} · ${format(mon, 'MMM d')}–${format(sun, 'd, yyyy')}`
  }
  return `W${weekNum} · ${format(mon, 'MMM d')} – ${format(sun, 'MMM d, yyyy')}`
}

// ── Pivot logic ───────────────────────────────────────────────────

type GroupRow = {
  key: string
  name: string
  subtitle: string | undefined
  days: Record<string, number>
  total: number
}

function buildPivot(entries: LogEntry[], groupBy: 'project' | 'task'): GroupRow[] {
  const map = new Map<string, GroupRow>()

  for (const entry of entries) {
    const key = groupBy === 'project' ? entry.projectId : entry.taskId
    const name = groupBy === 'project' ? entry.projectName : entry.taskName
    const subtitle = groupBy === 'task' ? entry.projectName : undefined

    if (!map.has(key)) {
      map.set(key, { key, name, subtitle, days: {}, total: 0 })
    }
    const row = map.get(key)!
    row.days[entry.entryDate] = (row.days[entry.entryDate] ?? 0) + entry.hours
    row.total += entry.hours
  }

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
}

function buildDayTotals(entries: LogEntry[]): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const e of entries) {
    totals[e.entryDate] = (totals[e.entryDate] ?? 0) + e.hours
  }
  return totals
}

// ── Cell helpers ──────────────────────────────────────────────────

function HoursCell({ hours }: { hours: number | undefined }) {
  if (!hours) return <span className="text-ink-300 text-sm">—</span>
  return (
    <span className="text-ink-1000 font-mono" style={{ fontSize: 13 }}>
      {hours % 1 === 0 ? hours : hours.toFixed(1)}
    </span>
  )
}

// ── Main page ─────────────────────────────────────────────────────

export function WeeklySummaryPage() {
  const { user } = useAuth()
  const isManager = user?.role === 'manager'

  // Reference date — always the Monday of the displayed week
  const [refDate, setRefDate] = useState(() => startOfISOWeek(new Date()))
  const [userFilter, setUserFilter] = useState('')
  const [groupBy, setGroupBy] = useState<'project' | 'task'>('project')

  const weekStr = toWeekStr(refDate)
  const weekDates = getWeekDates(weekStr)
  const weekHeader = formatWeekHeader(weekStr)

  const isCurrentWeek = toWeekStr(new Date()) === weekStr

  const { data: entries = [], isLoading } = useWeeklySummary(
    weekStr,
    isManager ? userFilter || undefined : undefined,
  )

  const { data: activeUsers = [] } = useQuery({
    queryKey: ['users', 'active'],
    queryFn: usersApi.listActive,
    enabled: isManager,
    staleTime: 60_000,
  })

  const rows = buildPivot(entries, groupBy)
  const dayTotals = buildDayTotals(entries)
  const grandTotal = entries.reduce((sum, e) => sum + e.hours, 0)

  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const thClass = 'text-ink-400 py-3 px-3 text-right font-mono uppercase whitespace-nowrap'
  const thStyle = { fontSize: 11, letterSpacing: '0.1em' } as const
  const tdClass = 'py-3 px-3 text-right'

  return (
    <div className="flex flex-col gap-6">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Week navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefDate((d) => startOfISOWeek(subWeeks(d, 1)))}
            className="border-ink-200 text-ink-600 hover:bg-ink-50 rounded-xl border p-2 transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-display text-ink-1000 font-bold" style={{ fontSize: 18 }}>
            {weekHeader}
          </span>
          <button
            onClick={() => setRefDate((d) => startOfISOWeek(addWeeks(d, 1)))}
            disabled={isCurrentWeek}
            className="border-ink-200 text-ink-600 hover:bg-ink-50 rounded-xl border p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Next week"
          >
            <ChevronRight size={16} />
          </button>
          {!isCurrentWeek && (
            <button
              onClick={() => setRefDate(startOfISOWeek(new Date()))}
              className="border-ink-200 text-ink-600 hover:bg-ink-50 rounded-xl border px-3 py-1.5 text-sm transition-colors"
            >
              This week
            </button>
          )}
        </div>

        {/* Group-by toggle */}
        <div
          className="border-ink-200 flex items-center gap-0.5 rounded-xl border bg-white p-1"
          style={{ boxShadow: '0 1px 3px rgba(11,11,18,0.04)' }}
        >
          <button
            onClick={() => setGroupBy('project')}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              groupBy === 'project'
                ? 'bg-tropical-magenta text-white'
                : 'text-ink-600 hover:bg-ink-50'
            }`}
          >
            By project
          </button>
          <button
            onClick={() => setGroupBy('task')}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              groupBy === 'task' ? 'bg-tropical-magenta text-white' : 'text-ink-600 hover:bg-ink-50'
            }`}
          >
            By task
          </button>
        </div>
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
      )}

      {/* Summary table */}
      <div
        className="border-ink-200 overflow-hidden rounded-2xl border bg-white"
        style={{ boxShadow: '0 1px 3px rgba(11,11,18,0.04)' }}
      >
        {isLoading ? (
          <div className="text-ink-400 flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-ink-400 text-sm">No entries for {weekHeader}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead>
                <tr className="border-ink-100 border-b">
                  <th
                    className="text-ink-400 py-3 pr-3 pl-5 text-left font-mono uppercase"
                    style={thStyle}
                  >
                    {groupBy === 'project' ? 'Project' : 'Task'}
                  </th>
                  {weekDates.map((date, i) => (
                    <th key={date} className={thClass} style={thStyle}>
                      <span className="block">{DAY_LABELS[i]}</span>
                      <span className="text-ink-300 block" style={{ fontSize: 10 }}>
                        {format(new Date(`${date}T00:00:00`), 'M/d')}
                      </span>
                    </th>
                  ))}
                  <th
                    className="border-ink-100 border-l py-3 pr-5 pl-3 text-right font-mono uppercase"
                    style={{ ...thStyle, color: 'var(--ink-600)' }}
                  >
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.key}
                    className="border-ink-100 hover:bg-ink-50/50 border-b last:border-b-0"
                  >
                    <td className="py-3 pr-3 pl-5">
                      <p className="text-ink-1000 font-semibold" style={{ fontSize: 14 }}>
                        {row.name}
                      </p>
                      {row.subtitle && (
                        <p className="text-ink-400 font-mono" style={{ fontSize: 11 }}>
                          {row.subtitle}
                        </p>
                      )}
                    </td>
                    {weekDates.map((date) => (
                      <td key={date} className={tdClass}>
                        <HoursCell hours={row.days[date]} />
                      </td>
                    ))}
                    <td className="border-ink-100 border-l py-3 pr-5 pl-3 text-right">
                      <span
                        className="text-ink-1000 font-mono font-semibold"
                        style={{ fontSize: 14 }}
                      >
                        {row.total % 1 === 0 ? row.total : row.total.toFixed(1)}h
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Totals footer */}
              <tfoot>
                <tr className="border-ink-100 bg-ink-50 border-t">
                  <td className="py-3 pr-3 pl-5">
                    <span
                      className="text-ink-400 font-mono font-semibold uppercase"
                      style={{ fontSize: 11, letterSpacing: '0.1em' }}
                    >
                      Total
                    </span>
                  </td>
                  {weekDates.map((date) => (
                    <td key={date} className={tdClass}>
                      {dayTotals[date] ? (
                        <span
                          className="text-ink-700 font-mono font-semibold"
                          style={{ fontSize: 13 }}
                        >
                          {(dayTotals[date] ?? 0) % 1 === 0
                            ? dayTotals[date]
                            : (dayTotals[date] ?? 0).toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-ink-300 text-sm">—</span>
                      )}
                    </td>
                  ))}
                  <td className="border-ink-100 border-l py-3 pr-5 pl-3 text-right">
                    <span className="text-ink-1000 font-mono font-bold" style={{ fontSize: 15 }}>
                      {grandTotal % 1 === 0 ? grandTotal : grandTotal.toFixed(1)}h
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
