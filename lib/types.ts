export type UserRole = 'STUDENT' | 'ADMIN'

export type StudentType = 'REGULAR' | 'LATERAL_ENTRY' | 'PWD'

export type ActivityGroup = 'GROUP_1' | 'GROUP_2' | 'GROUP_3'

export type AchievementLevel =
  | 'COLLEGE'
  | 'ZONAL'
  | 'STATE'
  | 'NATIONAL'
  | 'INTERNATIONAL'

export type SubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type CertificateStorage = 'LOCAL' | 'NEON'

export type CertificateEncoding = 'IDENTITY' | 'GZIP'

export type CertificateStorageMode = CertificateStorage | 'UNCONFIGURED'

export interface CertificateStorageUsage {
  usedBytes: number
  limitBytes: number
  remainingBytes: number
  percent: number
  mode: CertificateStorageMode
  isConfigured: boolean
  maxPdfBytes: number
  maxPdfMb: number
  maxImageBytes: number
  maxImageMb: number
  warning: string | null
}

export interface CurrentUser {
  id: string
  name: string
  email: string
  role: UserRole
  registerNo: string | null
  branch: string | null
  studentType: StudentType
}

export interface PointOption {
  label: string
  points: number
}

export interface HourlyPointRate {
  rate: number
  unit: string
  maxHours?: number
}

export interface ActivityPointsConfig {
  levelPoints?: Partial<Record<AchievementLevel, number>>
  options?: PointOption[]
  fixedPoints?: number
  hourlyRate?: HourlyPointRate
  maxPointsCap?: number
}

export type ActivityMode = 'LEVEL' | 'OPTION' | 'FIXED' | 'HOURLY'

export interface ActivityHeadDTO {
  id: string
  code: string
  title: string
  evidenceRequired: string
  maxPointsCap: number | null
  pointsConfig: ActivityPointsConfig
}

export interface CategoryDTO {
  id: string
  code: string
  group: ActivityGroup
  title: string
  maxPointsCap: number
  activities: ActivityHeadDTO[]
}

export interface SubmissionStudentDTO {
  id: string
  name: string
  registerNo: string | null
  branch: string | null
}

export interface SubmissionActivityDTO {
  id: string
  code: string
  title: string
  evidenceRequired: string
  maxPointsCap: number | null
  maxClaimPoints: number
}

export interface SubmissionDTO {
  id: string
  studentId: string
  activityHeadId: string
  group: ActivityGroup
  certificateUrl: string
  level: AchievementLevel | null
  selectedOption: string | null
  hoursSpent: number | null
  claimLabel: string | null
  claimedPoints: number
  approvedPoints: number | null
  activityApprovedPoints: number
  status: SubmissionStatus
  adminRemarks: string | null
  submittedAt: string
  reviewedAt: string | null
  student: SubmissionStudentDTO | null
  activityHead: SubmissionActivityDTO | null
}

export interface StudentProgressDTO {
  id: string
  name: string
  email: string
  registerNo: string | null
  branch: string | null
  studentType: StudentType
  groupPoints: Record<ActivityGroup, number>
  totalPoints: number
  targetTotal: number
  targetPerGroup: number
  isEligible: boolean
}

export interface StudentReport {
  student: StudentProgressDTO
  submissions: SubmissionDTO[]
}

export interface StudentTargets {
  total: number
  perGroup: number
}

export type ActionResult<T = undefined> =
  | ({ success: true } & (T extends undefined ? Record<string, never> : T))
  | { success: false; error: string }
