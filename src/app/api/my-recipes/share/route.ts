import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/userAuth'

export async function POST(request: Request) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const id = body.id

    if (!id) {
      return NextResponse.json({ error: 'ID обязателен' }, { status: 400 })
    }

    const recipe = await prisma.recipe.findFirst({
      where: { id, authorId: userId },
    })

    if (!recipe) {
      return NextResponse.json({ error: 'Рецепт не найден' }, { status: 404 })
    }

    if (recipe.status === 'published') {
      return NextResponse.json({ error: 'Уже опубликован' }, { status: 400 })
    }

    if (recipe.status === 'pending') {
      return NextResponse.json({ error: 'Уже на модерации' }, { status: 400 })
    }

    const updated = await prisma.recipe.update({
      where: { id },
      data: { status: 'pending' },
      include: {
        ingredients: { include: { ingredient: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Ошибка отправки' }, { status: 500 })
  }
}