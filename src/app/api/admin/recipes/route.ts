import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAuth } from '@/lib/auth'
import { deleteOrphanIngredients } from '@/lib/cleanupIngredients'

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
    await prisma.recipe.delete({ where: { id } })
    // RecipeIngredient снялись каскадом; MenuItem этого рецепта — тоже
    await deleteOrphanIngredients()
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Ошибка при удалении' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const isAuth = await checkAuth()
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, title, description, category, calories, instructions, ingredients } = body

    if (!id || !title || !category) {
      return NextResponse.json(
        { error: 'ID, название и категория обязательны' },
        { status: 400 }
      )
    }

    // Удаляем старые ингредиенты и создаём новые
    await prisma.recipeIngredient.deleteMany({ where: { recipeId: id } })

    const recipe = await prisma.recipe.update({
      where: { id },
      data: {
        title,
        description: description || null,
        instructions: instructions || '',
        calories: calories ? Number(calories) : null,
        category,
        ingredients: {
          create: (ingredients || []).map(
            (ing: { name: string; amount: number }) => ({
              amount: Number(ing.amount) || 0,
              ingredient: {
                connectOrCreate: {
                  where: { name: ing.name.trim() },
                  create: { name: ing.name.trim() },
                },
              },
            })
          ),
        },
      },
      include: {
        ingredients: {
          include: { ingredient: true },
        },
      },
    })
    await deleteOrphanIngredients()
    return NextResponse.json(recipe)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Ошибка при обновлении' }, { status: 500 })
  }
}
