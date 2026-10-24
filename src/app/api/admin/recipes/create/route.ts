import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAuth } from '@/lib/auth'

export async function POST(request: Request) {
  const isAuth = await checkAuth()
  if (!isAuth) {
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
        category, // просто строка
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
          include: {
            ingredient: true,
          },
        },
      },
    })

    return NextResponse.json(recipe)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Ошибка при создании' }, { status: 500 })
  }
}