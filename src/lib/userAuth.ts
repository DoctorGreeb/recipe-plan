import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto'

const secret = new TextEncoder().encode(
  process.env.USER_SESSION_SECRET || process.env.ADMIN_PASSWORD || 'user-dev-secret'
)

const COOKIE = 'user-session'

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const hashBuffer = Buffer.from(hash, 'hex')
  const test = scryptSync(password, salt, 64)
  if (hashBuffer.length !== test.length) return false
  return timingSafeEqual(hashBuffer, test)
}

export async function createUserSession(userId: string) {
  const token = await new SignJWT({ role: 'user', userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret)

  const cookieStore = await cookies()
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
}

export async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret)
    if (payload.role !== 'user' || typeof payload.userId !== 'string') return null
    return payload.userId
  } catch {
    return null
  }
}

export async function destroyUserSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE)
}