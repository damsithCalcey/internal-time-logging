import { addDays, format, subDays } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function DateNavigator({
  selectedDate,
  onDateChange,
  totalHours,
  isLoading,
}: {
  selectedDate: string
  onDateChange: (date: string) => void
  totalHours: number
  isLoading: boolean
}) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const dateLabel = format(new Date(`${selectedDate}T00:00:00`), 'EEEE, MMM d')

  const navigateDate = (delta: number) => {
    const d = new Date(`${selectedDate}T00:00:00`)
    const next = format(delta > 0 ? addDays(d, delta) : subDays(d, -delta), 'yyyy-MM-dd')
    if (next <= today) onDateChange(next)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => navigateDate(-1)}
        className="border-ink-200 text-ink-600 hover:bg-ink-50 rounded-xl border p-2 transition-colors"
        aria-label="Previous day"
      >
        <ChevronLeft size={16} />
      </button>
      <div className="flex flex-col">
        <span className="font-display text-ink-1000 font-bold" style={{ fontSize: 18 }}>
          {dateLabel}
        </span>
        {!isLoading && totalHours > 0 && (
          <span className="text-ink-500 font-mono" style={{ fontSize: 12 }}>
            {totalHours}h logged
          </span>
        )}
      </div>
      <button
        onClick={() => navigateDate(1)}
        disabled={selectedDate >= today}
        className="border-ink-200 text-ink-600 hover:bg-ink-50 rounded-xl border p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Next day"
      >
        <ChevronRight size={16} />
      </button>
      {selectedDate !== today && (
        <button
          onClick={() => onDateChange(today)}
          className="border-ink-200 text-ink-600 hover:bg-ink-50 rounded-xl border px-3 py-1.5 text-sm transition-colors"
        >
          Today
        </button>
      )}
    </div>
  )
}
