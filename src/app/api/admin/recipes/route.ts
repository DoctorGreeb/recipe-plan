import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAuth } from '@/lib/auth'

export async function GET() {
  const isAuth = await checkAuth()
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const recipes = await prisma.recipe.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      ingredients: {
        include: {
          ingredient: true,
        },
      },
    },
  })

  return NextResponse.json(recipes)
}

export async function DELETE(request: Request) {
  const isAuth = await checkAuth()
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'ID обязателен' }, { status: 400 })
  }

  try {
    // Cascade удалит связанные RecipeIngredient
    await prisma.recipe.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Ошибка при удалении' }, { status: 500 })
  }
}