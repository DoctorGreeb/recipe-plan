import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/userAuth'
import { deleteOrphanIngredients } from '@/lib/cleanupIngredients'

export async function GET() {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const recipes = await prisma.recipe.findMany({
    where: { authorId: userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      ingredients: { include: { ingredient: true } },
    },
  })

  return NextResponse.json(recipes)
}

export async function POST(request: Request) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, description, category, calories, instructions, ingredients } = body

    if (!title || !category) {
      return NextResponse.json(
        { error: 'Название и категория обязательны' },
        { status: 400 }
      )
    }

    const recipe = await prisma.recipe.create({
      data: {
        title,
        description: description || null,
        instructions: instructions || '',
        calories: calories ? Number(calories) : null,
        category,
        authorId: userId,
        status: 'draft',
        ingredients: {
          create: (ingredients || []).map(
            (ing: { name: string; amount: number }) => ({
              amount: Number(ing.amount) || 0,
              ingredient: {
                connectOrCreate: {
                  where: { name: String(ing.name).trim() },
                  create: { name: String(ing.name).trim() },
                },
              },
            })
          ),
        },
      },
      include: {
        ingredients: { include: { ingredient: true } },
      },
    })

    return NextResponse.json(recipe)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Ошибка создания' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const userId = await getUserId()
  if (!userId) {
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

    const existing = await prisma.recipe.findFirst({
      where: { id, authorId: userId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Рецепт не найден' }, { status: 404 })
    }

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
                  where: { name: String(ing.name).trim() },
                  create: { name: String(ing.name).trim() },
                },
              },
            })
          ),
        },
      },
      include: {
        ingredients: { include: { ingredient: true } },
      },
    })

    await deleteOrphanIngredients()
    return NextResponse.json(recipe)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Ошибка обновления' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = new URL(request.url).searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'ID обязателен' }, { status: 400 })
  }

  const existing = await prisma.recipe.findFirst({
    where: { id, authorId: userId },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Рецепт не найден' }, { status: 404 })
  }

  try {
    await prisma.recipe.delete({ where: { id } })
    await deleteOrphanIngredients()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Ошибка удаления' }, { status: 500 })
  }
}