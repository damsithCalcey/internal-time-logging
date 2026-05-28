import { addWeeks, startOfISOWeek, subWeeks } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatWeekHeader, toWeekStr } from '../utils'

interface WeekNavigatorProps {
  refDate: Date
  onRefDateChange: (date: Date) => void
  groupBy: 'project' | 'task'
  onGroupByChange: (groupBy: 'project' | 'task') => void
}

export function WeekNavigator({
  refDate,
  onRefDateChange,
  groupBy,
  onGroupByChange,
}: WeekNavigatorProps) {
  const weekStr = toWeekStr(refDate)
  const weekHeader = formatWeekHeader(weekStr)
  const isCurrentWeek = toWeekStr(new Date()) === weekStr

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Week navigator */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onRefDateChange(startOfISOWeek(subWeeks(refDate, 1)))}
          className="border-ink-200 text-ink-600 hover:bg-ink-50 rounded-xl border p-2 transition-colors"
          aria-label="Previous week"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="font-display text-ink-1000 font-bold" style={{ fontSize: 18 }}>
          {weekHeader}
        </span>
        <button
          onClick={() => onRefDateChange(startOfISOWeek(addWeeks(refDate, 1)))}
          disabled={isCurrentWeek}
          className="border-ink-200 text-ink-600 hover:bg-ink-50 rounded-xl border p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next week"
        >
          <ChevronRight size={16} />
        </button>
        {!isCurrentWeek && (
          <button
            onClick={() => onRefDateChange(startOfISOWeek(new Date()))}
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
          onClick={() => onGroupByChange('project')}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
            groupBy === 'project'
              ? 'bg-tropical-magenta text-white'
              : 'text-ink-600 hover:bg-ink-50'
          }`}
        >
          By project
        </button>
        <button
          onClick={() => onGroupByChange('task')}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
            groupBy === 'task' ? 'bg-tropical-magenta text-white' : 'text-ink-600 hover:bg-ink-50'
          }`}
        >
          By task
        </button>
      </div>
    </div>
  )
}
