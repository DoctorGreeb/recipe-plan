import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const recipe = await prisma.recipe.findUnique({
    where: { id },
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