import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.ADMIN_PASSWORD || 'secret')

export async function createSession() {
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(secret)

  const cookieStore = await cookies()
  cookieStore.set('admin-session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 часа
    path: '/',
  })
}

export async function checkAuth() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin-session')?.value
  if (!token) return false

  try {
    await jwtVerify(token, secret)
    return true
  } catch {
    return false
  }
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete('admin-session')
}