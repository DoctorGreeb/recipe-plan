import { NextResponse } from 'next/server'
import { createSession } from '@/lib/auth'

export async function POST(request: Request) {
  const { login, password } = await request.json()

  if (
    login === process.env.ADMIN_LOGIN &&
    password === process.env.ADMIN_PASSWORD
  ) {
    await createSession()
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Неверные данные' }, { status: 401 })
}