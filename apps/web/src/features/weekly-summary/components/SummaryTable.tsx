import type { LogEntry } from '@repo/shared-types'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { buildDayTotals, buildPivot, getWeekDates } from '../utils'

interface SummaryTableProps {
  entries: LogEntry[]
  isLoading: boolean
  weekStr: string
  groupBy: 'project' | 'task'
  weekHeader: string
}

function HoursCell({ hours }: { hours: number | undefined }) {
  if (!hours) return <span className="text-ink-300 text-sm">—</span>
  return (
    <span className="text-ink-1000 font-mono" style={{ fontSize: 13 }}>
      {hours % 1 === 0 ? hours : hours.toFixed(1)}
    </span>
  )
}

export function SummaryTable({
  entries,
  isLoading,
  weekStr,
  groupBy,
  weekHeader,
}: SummaryTableProps) {
  const weekDates = getWeekDates(weekStr)
  const rows = buildPivot(entries, groupBy)
  const dayTotals = buildDayTotals(entries)
  const grandTotal = entries.reduce((sum, e) => sum + e.hours, 0)

  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const thClass = 'text-ink-400 py-3 px-3 text-right font-mono uppercase whitespace-nowrap'
  const thStyle = { fontSize: 11, letterSpacing: '0.1em' } as const
  const tdClass = 'py-3 px-3 text-right'

  return (
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
  )
}
