'use server'

import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { redirect } from 'next/navigation'
import { clearSessionCookie, setSessionCookie } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  isStudentType,
  isValidEmail,
  isValidName,
  isValidPassword,
  isValidRegisterNo,
  normalizeEmail,
  normalizeName,
  normalizeRegisterNo,
  normalizeShortText,
} from '@/lib/validation'

const BCRYPT_COST = 12
const DUMMY_HASH = '$2b$12$T79EFv70pWEUDejUk.7aZejW2CFChT6dNaVTT2QkWFsxS4rzcrqbu'

export interface AuthActionResult {
  success?: boolean
  error?: string
  redirectTo?: string
}

export async function loginAction(formData: FormData): Promise<AuthActionResult> {
  const email = normalizeEmail(formData.get('email'))
  const password = formData.get('password')

  if (!isValidEmail(email) || typeof password !== 'string' || !password || password.length > 200) {
    return { error: 'Invalid email or password.' }
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } })
    const passwordMatches = await bcrypt.compare(password, user?.password ?? DUMMY_HASH)

    if (!user || !passwordMatches) {
      return { error: 'Invalid email or password.' }
    }

    await setSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    })

    return {
      success: true,
      redirectTo: user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard',
    }
  } catch (error) {
    console.error('Login failed:', error)
    return { error: 'Unable to sign in right now. Please try again.' }
  }
}

export async function registerAction(formData: FormData): Promise<AuthActionResult> {
  const name = normalizeName(formData.get('name'))
  const email = normalizeEmail(formData.get('email'))
  const password = formData.get('password')
  const registerNo = normalizeRegisterNo(formData.get('registerNo'))
  const branch = normalizeShortText(formData.get('branch'), 100)
  const studentTypeValue = formData.get('studentType')
  const studentType = isStudentType(studentTypeValue) ? studentTypeValue : 'REGULAR'

  if (!isValidName(name)) {
    return { error: 'Enter your full name (2 to 100 characters).' }
  }

  if (!isValidEmail(email)) {
    return { error: 'Enter a valid email address.' }
  }

  if (!isValidPassword(password)) {
    return { error: 'Password must be between 8 and 72 characters.' }
  }

  if (!isValidRegisterNo(registerNo)) {
    return { error: 'Enter a valid KTU register number.' }
  }

  if (branch.length < 2) {
    return { error: 'Enter your branch or department.' }
  }

  try {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { registerNo }] },
      select: { email: true, registerNo: true },
    })

    if (existing) {
      return {
        error:
          existing.email === email
            ? 'An account with this email already exists.'
            : 'An account with this register number already exists.',
      }
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_COST)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'STUDENT',
        registerNo,
        branch,
        studentType,
      },
    })

    await setSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    })

    return { success: true, redirectTo: '/dashboard' }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { error: 'An account with this email or register number already exists.' }
    }

    console.error('Registration failed:', error)
    return { error: 'Unable to create your account right now. Please try again.' }
  }
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie()
  redirect('/login')
}
