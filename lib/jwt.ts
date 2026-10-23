import { SignJWT, jwtVerify } from 'jose'
import type { UserRole } from './types'

export const SESSION_COOKIE = 'ktu_auth_token'
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60

export interface SessionPayload {
  userId: string
  email: string
  role: UserRole
  name: string
}

function getSessionSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('NEXTAUTH_SECRET must be configured before running in production.')
    }
    return new TextEncoder().encode('ktu-activity-points-development-secret-key')
  }

  if (process.env.NODE_ENV === 'production' && secret.length < 32) {
    throw new Error('NEXTAUTH_SECRET must be at least 32 characters long in production.')
  }

  return new TextEncoder().encode(secret)
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSessionSecret())
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      algorithms: ['HS256'],
    })

    if (
      typeof payload.userId !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.name !== 'string' ||
      (payload.role !== 'STUDENT' && payload.role !== 'ADMIN')
    ) {
      return null
    }

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      name: payload.name,
    }
  } catch {
    return null
  }
}
