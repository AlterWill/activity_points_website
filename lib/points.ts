import type {
  AchievementLevel,
  ActivityMode,
  ActivityPointsConfig,
  HourlyPointRate,
  PointOption,
  StudentTargets,
  StudentType,
} from './types'

export const ACHIEVEMENT_LEVELS: AchievementLevel[] = [
  'COLLEGE',
  'ZONAL',
  'STATE',
  'NATIONAL',
  'INTERNATIONAL',
]

export const ACHIEVEMENT_LEVEL_LABELS: Record<AchievementLevel, string> = {
  COLLEGE: 'College',
  ZONAL: 'Zonal',
  STATE: 'State',
  NATIONAL: 'National',
  INTERNATIONAL: 'International',
}

const STUDENT_TARGETS: Record<StudentType, StudentTargets> = {
  REGULAR: { total: 120, perGroup: 40 },
  LATERAL_ENTRY: { total: 90, perGroup: 30 },
  PWD: { total: 60, perGroup: 20 },
}

export function getStudentTargets(studentType: StudentType): StudentTargets {
  return STUDENT_TARGETS[studentType] ?? STUDENT_TARGETS.REGULAR
}

export function isAchievementLevel(value: unknown): value is AchievementLevel {
  return typeof value === 'string' && ACHIEVEMENT_LEVELS.includes(value as AchievementLevel)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toPositiveInteger(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined
  const rounded = Math.round(value)
  return rounded > 0 ? rounded : undefined
}

function normalizeLevelPoints(value: unknown): Partial<Record<AchievementLevel, number>> | undefined {
  if (!isRecord(value)) return undefined
  const normalized: Partial<Record<AchievementLevel, number>> = {}

  for (const [key, rawPoints] of Object.entries(value)) {
    const level = key.trim().toUpperCase()
    if (!isAchievementLevel(level)) continue
    const points = toPositiveInteger(rawPoints)
    if (points !== undefined) normalized[level] = points
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined
}

function normalizeOptions(value: unknown): PointOption[] | undefined {
  if (!Array.isArray(value)) return undefined

  const options = value
    .map((option): PointOption | null => {
      if (!isRecord(option)) return null
      if (typeof option.label !== 'string') return null
      const label = option.label.trim()
      const points = toPositiveInteger(option.points)
      if (!label || label.length > 160 || points === undefined) return null
      return { label, points }
    })
    .filter((option): option is PointOption => option !== null)
    .slice(0, 50)

  return options.length > 0 ? options : undefined
}

function normalizeHourlyRate(value: unknown): HourlyPointRate | undefined {
  if (!isRecord(value)) return undefined
  const rate = toPositiveInteger(value.rate)
  if (rate === undefined) return undefined

  const unit = typeof value.unit === 'string' && value.unit.trim() ? value.unit.trim().slice(0, 20) : 'hour'
  const maxHours = toPositiveInteger(value.maxHours)

  return { rate, unit, ...(maxHours !== undefined ? { maxHours } : {}) }
}

export function normalizeActivityConfig(value: unknown): ActivityPointsConfig {
  if (!isRecord(value)) return {}

  const levelPoints = normalizeLevelPoints(value.levelPoints)
  const options = normalizeOptions(value.options)
  const fixedPoints = toPositiveInteger(value.fixedPoints)
  const hourlyRate = normalizeHourlyRate(value.hourlyRate)
  const maxPointsCap = toPositiveInteger(value.maxPointsCap)

  return {
    ...(levelPoints ? { levelPoints } : {}),
    ...(options ? { options } : {}),
    ...(fixedPoints !== undefined ? { fixedPoints } : {}),
    ...(hourlyRate ? { hourlyRate } : {}),
    ...(maxPointsCap !== undefined ? { maxPointsCap } : {}),
  }
}

export function getActivityMode(config: ActivityPointsConfig): ActivityMode | null {
  if (config.levelPoints && Object.keys(config.levelPoints).length > 0) return 'LEVEL'
  if (config.options && config.options.length > 0) return 'OPTION'
  if (config.hourlyRate) return 'HOURLY'
  if (config.fixedPoints !== undefined) return 'FIXED'
  return null
}

export function getConfiguredLevels(config: ActivityPointsConfig): AchievementLevel[] {
  if (!config.levelPoints) return []
  return ACHIEVEMENT_LEVELS.filter((level) => config.levelPoints?.[level] !== undefined)
}

export function getMaxHours(config: ActivityPointsConfig): number {
  const hourly = config.hourlyRate
  if (!hourly) return 0
  if (hourly.maxHours) return hourly.maxHours
  if (config.maxPointsCap) return Math.max(1, Math.floor(config.maxPointsCap / hourly.rate))
  return 200
}

export function getMaxClaimPoints(config: ActivityPointsConfig): number {
  const mode = getActivityMode(config)
  if (!mode) return 0

  let max = 0
  if (mode === 'LEVEL') {
    max = Math.max(...Object.values(config.levelPoints ?? {}).map((points) => points ?? 0))
  } else if (mode === 'OPTION') {
    max = Math.max(...(config.options ?? []).map((option) => option.points))
  } else if (mode === 'FIXED') {
    max = config.fixedPoints ?? 0
  } else if (mode === 'HOURLY' && config.hourlyRate) {
    max = config.hourlyRate.rate * getMaxHours(config)
  }

  return config.maxPointsCap ? Math.min(max, config.maxPointsCap) : max
}

export interface ClaimInput {
  level?: string | null
  selectedOption?: string | null
  hoursSpent?: number | null
}

export interface ClaimCalculation {
  points: number
  label: string
  mode: ActivityMode
}

export function calculateClaim(
  config: ActivityPointsConfig,
  input: ClaimInput
): ClaimCalculation | { error: string } {
  const mode = getActivityMode(config)
  if (!mode) {
    return { error: 'This activity does not have a valid point configuration. Please contact your faculty advisor.' }
  }

  let points = 0
  let label = ''

  if (mode === 'LEVEL') {
    const level = typeof input.level === 'string' ? input.level.trim().toUpperCase() : ''
    if (!isAchievementLevel(level) || config.levelPoints?.[level] === undefined) {
      return { error: 'Select a valid achievement level for this activity.' }
    }
    points = config.levelPoints[level] ?? 0
    label = `${ACHIEVEMENT_LEVEL_LABELS[level]} level`
  } else if (mode === 'OPTION') {
    const selected = typeof input.selectedOption === 'string' ? input.selectedOption.trim() : ''
    const option = config.options?.find((item) => item.label === selected)
    if (!option) {
      return { error: 'Select a valid option for this activity.' }
    }
    points = option.points
    label = option.label
  } else if (mode === 'FIXED') {
    points = config.fixedPoints ?? 0
    label = 'Standard activity points'
  } else if (mode === 'HOURLY') {
    const hours = input.hoursSpent
    if (typeof hours !== 'number' || !Number.isInteger(hours)) {
      return { error: 'Enter the number of completed hours.' }
    }
    const maxHours = getMaxHours(config)
    if (hours < 1 || hours > maxHours) {
      return { error: `Hours must be between 1 and ${maxHours}.` }
    }
    points = hours * (config.hourlyRate?.rate ?? 0)
    label = `${hours} ${config.hourlyRate?.unit ?? 'hour'}${hours === 1 ? '' : 's'} completed`
  }

  if (points <= 0) {
    return { error: 'This claim does not award any points.' }
  }

  if (config.maxPointsCap && points > config.maxPointsCap) {
    return { error: `This claim exceeds the maximum of ${config.maxPointsCap} points for this activity.` }
  }

  return { points, label, mode }
}
