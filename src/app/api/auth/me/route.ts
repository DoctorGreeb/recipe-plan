import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/userAuth'

export async function GET() {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ user: null })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  })

  return NextResponse.json({ user })
}