import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAuth } from '@/lib/auth'

export async function GET() {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const recipes = await prisma.recipe.findMany({
    where: { status: 'pending' },
    orderBy: { updatedAt: 'asc' },
    include: {
      author: { select: { id: true, email: true, name: true } },
      ingredients: { include: { ingredient: true } },
    },
  })

  return NextResponse.json(recipes)
}

export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id, action } = await request.json()

    if (!id || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 })
    }

    const recipe = await prisma.recipe.findFirst({
      where: { id, status: 'pending' },
    })

    if (!recipe) {
      return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 })
    }

    const updated = await prisma.recipe.update({
      where: { id },
      data: { status: action === 'approve' ? 'published' : 'rejected' },
      include: {
        author: { select: { id: true, email: true, name: true } },
        ingredients: { include: { ingredient: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Ошибка модерации' }, { status: 500 })
  }
}