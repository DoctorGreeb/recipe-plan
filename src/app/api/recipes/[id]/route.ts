import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/userAuth'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const userId = await getUserId()

  const recipe = await prisma.recipe.findFirst({
    where: {
      id,
      OR: [
        { status: 'published' },
        ...(userId ? [{ authorId: userId }] : []),
      ],
    },
    include: {
      ingredients: {
        include: { ingredient: true },
      },
    },
  })

  if (!recipe) {
    return NextResponse.json({ error: 'Рецепт не найден' }, { status: 404 })
  }

  return NextResponse.json(recipe)
}
