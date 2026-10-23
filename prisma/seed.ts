import { Prisma, PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { KTU_2024_HANDBOOK_CATEGORIES } from '../lib/ktu-rules'

const prisma = new PrismaClient()

function buildPointsConfig(activity: (typeof KTU_2024_HANDBOOK_CATEGORIES)[number]['activities'][number]) {
  const config = {
    ...(activity.levelPoints ? { levelPoints: activity.levelPoints } : {}),
    ...(activity.options ? { options: activity.options } : {}),
    ...(activity.fixedPoints !== undefined ? { fixedPoints: activity.fixedPoints } : {}),
    ...(activity.hourlyRate ? { hourlyRate: activity.hourlyRate } : {}),
    ...(activity.maxPointsCap !== undefined ? { maxPointsCap: activity.maxPointsCap } : {}),
  }

  return JSON.parse(JSON.stringify(config)) as Prisma.InputJsonObject
}

async function seedCatalog() {
  const activeCategoryCodes: string[] = []
  const activeActivityCodes: string[] = []
  let activityCount = 0

  for (const [categoryIndex, categoryDefinition] of KTU_2024_HANDBOOK_CATEGORIES.entries()) {
    const category = await prisma.category.upsert({
      where: { code: categoryDefinition.code },
      update: {
        group: categoryDefinition.group,
        title: categoryDefinition.title,
        maxPointsCap: categoryDefinition.maxPointsCap,
        isActive: true,
        sortOrder: categoryIndex,
      },
      create: {
        code: categoryDefinition.code,
        group: categoryDefinition.group,
        title: categoryDefinition.title,
        maxPointsCap: categoryDefinition.maxPointsCap,
        isActive: true,
        sortOrder: categoryIndex,
      },
    })

    activeCategoryCodes.push(categoryDefinition.code)

    for (const [activityIndex, activity] of categoryDefinition.activities.entries()) {
      const data = {
        categoryId: category.id,
        title: activity.title,
        evidenceRequired: activity.evidenceRequired,
        maxPointsCap: activity.maxPointsCap ?? null,
        pointsConfig: buildPointsConfig(activity),
        isActive: true,
        sortOrder: activityIndex,
      }

      await prisma.activityHead.upsert({
        where: { code: activity.code },
        update: data,
        create: { code: activity.code, ...data },
      })

      activeActivityCodes.push(activity.code)
      activityCount += 1
    }
  }

  if (activeCategoryCodes.length > 0) {
    await prisma.category.updateMany({
      where: { code: { notIn: activeCategoryCodes } },
      data: { isActive: false },
    })
  }

  if (activeActivityCodes.length > 0) {
    await prisma.activityHead.updateMany({
      where: { code: { notIn: activeActivityCodes } },
      data: { isActive: false },
    })
  }

  return { categoryCount: activeCategoryCodes.length, activityCount }
}

async function seedUsers() {
  const isProduction = process.env.NODE_ENV === 'production'
  const resetPasswords = process.env.SEED_RESET_PASSWORDS === 'true'
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@ktu.edu').trim().toLowerCase()
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || (isProduction ? '' : 'admin123')

  if (!adminPassword) {
    throw new Error('SEED_ADMIN_PASSWORD must be set when seeding in production.')
  }

  if (new TextEncoder().encode(adminPassword).length > 72) {
    throw new Error('SEED_ADMIN_PASSWORD must be 72 bytes or fewer.')
  }

  const adminHash = await bcrypt.hash(adminPassword, 12)

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'ADMIN',
      ...(resetPasswords ? { password: adminHash } : {}),
    },
    create: {
      name: process.env.SEED_ADMIN_NAME || 'Dr. Suresh V. (Senior Faculty Advisor)',
      email: adminEmail,
      password: adminHash,
      role: 'ADMIN',
      registerNo: process.env.SEED_ADMIN_REGISTER_NO || 'FAC-CS-102',
      branch: 'Computer Science and Engineering',
      studentType: 'REGULAR',
    },
  })

  let demoStudent: { email: string; password: string } | null = null

  if (!isProduction && process.env.SEED_DEMO_STUDENT !== 'false') {
    const studentEmail = (process.env.SEED_STUDENT_EMAIL || 'student@ktu.edu').trim().toLowerCase()
    const studentPassword = process.env.SEED_STUDENT_PASSWORD || 'student123'
    if (new TextEncoder().encode(studentPassword).length > 72) {
      throw new Error('SEED_STUDENT_PASSWORD must be 72 bytes or fewer.')
    }

    const studentHash = await bcrypt.hash(studentPassword, 12)

    await prisma.user.upsert({
      where: { email: studentEmail },
      update: {
        role: 'STUDENT',
        ...(resetPasswords ? { password: studentHash } : {}),
      },
      create: {
        name: 'Adithya Kumar',
        email: studentEmail,
        password: studentHash,
        role: 'STUDENT',
        registerNo: 'TVE24CS042',
        branch: 'Computer Science and Engineering',
        studentType: 'REGULAR',
      },
    })

    demoStudent = { email: studentEmail, password: studentPassword }
  }

  return { adminEmail, adminPassword, demoStudent }
}

async function main() {
  console.log('--- KTU 2024 Activity Points seed ---')

  const catalog = await seedCatalog()
  console.log(`Catalog ready: ${catalog.categoryCount} categories, ${catalog.activityCount} activities.`)

  const users = await seedUsers()
  console.log(`Faculty advisor ready: ${users.adminEmail}`)

  if (users.demoStudent) {
    console.log(`Demo student ready: ${users.demoStudent.email}`)
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('')
    console.log('Development credentials:')
    console.log(`  Faculty advisor: ${users.adminEmail} / ${users.adminPassword}`)
    if (users.demoStudent) {
      console.log(`  Student:         ${users.demoStudent.email} / ${users.demoStudent.password}`)
    }
    console.log('Change these passwords before using the app with real student data.')
  }
}

main()
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
