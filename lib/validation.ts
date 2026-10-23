export function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

export function isValidEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidPassword(password: unknown): password is string {
  return (
    typeof password === 'string' &&
    password.length >= 8 &&
    password.length <= 72 &&
    new TextEncoder().encode(password).length <= 72
  )
}

export function normalizeName(value: unknown): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
}

export function isValidName(name: string): boolean {
  return name.length >= 2 && name.length <= 100
}

export function normalizeRegisterNo(value: unknown): string {
  return typeof value === 'string' ? value.trim().toUpperCase() : ''
}

export function isValidRegisterNo(registerNo: string): boolean {
  return /^[A-Z0-9][A-Z0-9/-]{2,29}$/.test(registerNo)
}

export function normalizeShortText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

export function isUuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  )
}

export function isStudentType(value: unknown): value is 'REGULAR' | 'LATERAL_ENTRY' | 'PWD' {
  return value === 'REGULAR' || value === 'LATERAL_ENTRY' || value === 'PWD'
}
