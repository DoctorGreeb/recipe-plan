import { NextResponse } from 'next/server'
import { createSession } from '@/lib/auth'

export async function POST(request: Request) {
  if (!process.env.ADMIN_LOGIN || !process.env.ADMIN_PASSWORD) {
    console.error('ADMIN_LOGIN and ADMIN_PASSWORD must be configured')
    return NextResponse.json(
      { error: 'Вход администратора не настроен на сервере' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const login = typeof body?.login === 'string' ? body.login : ''
    const password = typeof body?.password === 'string' ? body.password : ''

    if (
      login !== process.env.ADMIN_LOGIN ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return NextResponse.json({ error: 'Неверные данные' }, { status: 401 })
    }

    await createSession()
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 })
  }
}
