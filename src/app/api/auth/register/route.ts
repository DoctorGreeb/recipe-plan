import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createUserSession, hashPassword } from '@/lib/userAuth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
    const name = body.name ? String(body.name).trim() : null

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Укажите email и пароль' },
        { status: 400 }
      )
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль не короче 6 символов' },
        { status: 400 }
      )
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Некорректный email' }, { status: 400 })
    }

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже есть' },
        { status: 409 }
      )
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: hashPassword(password),
      },
    })

    await createUserSession(user.id)

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Ошибка регистрации' }, { status: 500 })
  }
}