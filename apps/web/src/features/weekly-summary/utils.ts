import type { LogEntry } from '@repo/shared-types'
import { format, getISOWeek, getISOWeekYear } from 'date-fns'

export function toWeekStr(date: Date): string {
  return `${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, '0')}`
}

export function getWeekDates(weekStr: string): string[] {
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

export function formatWeekHeader(weekStr: string): string {
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

export type GroupRow = {
  key: string
  name: string
  subtitle: string | undefined
  days: Record<string, number>
  total: number
}

export function buildPivot(entries: LogEntry[], groupBy: 'project' | 'task'): GroupRow[] {
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

export function buildDayTotals(entries: LogEntry[]): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const e of entries) {
    totals[e.entryDate] = (totals[e.entryDate] ?? 0) + e.hours
  }
  return totals
}
