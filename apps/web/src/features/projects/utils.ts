export const PROJECT_COLORS = [
  '#AD1AAC',
  '#307FE2',
  '#2C9F69',
  '#E8A33A',
  '#DF4661',
  '#59CBE8',
  '#8E158D',
  '#1A4F96',
]

export function projectColor(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return PROJECT_COLORS[h % PROJECT_COLORS.length]!
}

export function projectCode(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 3)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
    .padEnd(3, name[1]?.toUpperCase() ?? 'X')
    .slice(0, 3)
}

export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
}
