import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfWeek, parseISO, format } from 'date-fns'

function getWeekStart(dateStr?: string | null): Date {
  const base = dateStr ? parseISO(dateStr) : new Date()
  // понедельник, 00:00:00
  const monday = startOfWeek(base, { weekStartsOn: 1 })
  monday.setHours(0, 0, 0, 0)
  return monday
}

/** GET /api/menu?week=2026-10-20 — меню на неделю */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const weekStart = getWeekStart(searchParams.get('week'))

  const items = await prisma.menuItem.findMany({
    where: { weekStart },
    include: {
      recipe: {
        select: {
          id: true,
          title: true,
          category: true,
          calories: true,
        },
      },
    },
    orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }],
  })

  return NextResponse.json({
    weekStart: format(weekStart, 'yyyy-MM-dd'),
    items,
  })
}

/** PUT /api/menu — назначить/заменить рецепт в слоте */
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { recipeId, dayOfWeek, mealType, week } = body

    if (
      !recipeId ||
      dayOfWeek === undefined ||
      !mealType ||
      !['breakfast', 'lunch', 'dinner'].includes(mealType) ||
      dayOfWeek < 0 ||
      dayOfWeek > 6
    ) {
      return NextResponse.json(
        { error: 'Нужны recipeId, dayOfWeek (0–6), mealType (breakfast|lunch|dinner)' },
        { status: 400 }
      )
    }

    const weekStart = getWeekStart(week)

    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } })
    if (!recipe) {
      return NextResponse.json({ error: 'Рецепт не найден' }, { status: 404 })
    }

    const item = await prisma.menuItem.upsert({
      where: {
        weekStart_dayOfWeek_mealType: {
          weekStart,
          dayOfWeek: Number(dayOfWeek),
          mealType,
        },
      },
      create: {
        recipeId,
        dayOfWeek: Number(dayOfWeek),
        mealType,
        weekStart,
      },
      update: { recipeId },
      include: {
        recipe: {
          select: { id: true, title: true, category: true, calories: true },
        },
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Ошибка сохранения' }, { status: 500 })
  }
}

/** DELETE /api/menu — очистить слот */
export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { dayOfWeek, mealType, week } = body

    if (
      dayOfWeek === undefined ||
      !mealType ||
      !['breakfast', 'lunch', 'dinner'].includes(mealType)
    ) {
      return NextResponse.json(
        { error: 'Нужны dayOfWeek и mealType' },
        { status: 400 }
      )
    }

    const weekStart = getWeekStart(week)

    await prisma.menuItem.deleteMany({
      where: {
        weekStart,
        dayOfWeek: Number(dayOfWeek),
        mealType,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Ошибка удаления' }, { status: 500 })
  }
}