import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createUserSession, verifyPassword } from '@/lib/userAuth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Укажите email и пароль' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      )
    }

    await createUserSession(user.id)

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Ошибка входа' }, { status: 500 })
  }
}