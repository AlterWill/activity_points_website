import type { ActivityGroup, StudentType } from './types'

const DATE_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return '—'
  return DATE_FORMATTER.format(date)
}

export const GROUP_LABELS: Record<ActivityGroup, string> = {
  GROUP_1: 'Group I',
  GROUP_2: 'Group II',
  GROUP_3: 'Group III',
}

export const GROUP_DESCRIPTIONS: Record<ActivityGroup, string> = {
  GROUP_1: 'Sports, arts, culture, NSS, NCC and community outreach',
  GROUP_2: 'Technical events, leadership, FOSS and standardized tests',
  GROUP_3: 'Internships, innovation, patents, hackathons and skilling',
}

export const STUDENT_TYPE_LABELS: Record<StudentType, string> = {
  REGULAR: 'Regular',
  LATERAL_ENTRY: 'Lateral Entry',
  PWD: 'PwD',
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  const decimals = value >= 10 || exponent === 0 ? 0 : 1

  return `${value.toFixed(decimals)} ${units[exponent]}`
}
