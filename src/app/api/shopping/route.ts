import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfWeek, parseISO, format } from 'date-fns'

function getWeekStart(dateStr?: string | null): Date {
  const base = dateStr ? parseISO(dateStr) : new Date()
  const monday = startOfWeek(base, { weekStartsOn: 1 })
  monday.setHours(0, 0, 0, 0)
  return monday
}

/** Суммирование ингредиентов по меню недели */
async function aggregateFromMenu(weekStart: Date) {
  const menuItems = await prisma.menuItem.findMany({
    where: { weekStart },
    include: {
      recipe: {
        include: {
          ingredients: {
            include: { ingredient: true },
          },
        },
      },
    },
  })

  // ingredientId → { amount, unit, name }
  const map = new Map<
    string,
    { amount: number; unit: string; name: string }
  >()

  for (const slot of menuItems) {
    for (const ri of slot.recipe.ingredients) {
      const id = ri.ingredientId
      const prev = map.get(id)
      if (prev) {
        prev.amount += ri.amount
      } else {
        map.set(id, {
          amount: ri.amount,
          unit: ri.ingredient.unit,
          name: ri.ingredient.name,
        })
      }
    }
  }

  return map
}

/**
 * GET /api/shopping?week=YYYY-MM-DD
 * Если записей нет — автоматически собирает из меню.
 * ?rebuild=1 — пересобрать, сохраняя галочки где возможно.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const weekStart = getWeekStart(searchParams.get('week'))
  const rebuild = searchParams.get('rebuild') === '1'

  try {
    let items = await prisma.shoppingItem.findMany({
      where: { weekStart },
      include: { ingredient: true },
      orderBy: { ingredient: { name: 'asc' } },
    })

    if (items.length === 0 || rebuild) {
      const aggregated = await aggregateFromMenu(weekStart)

      // Старые галочки: ingredientId → isBought
      const boughtMap = new Map(
        items.map((i) => [i.ingredientId, i.isBought])
      )

      await prisma.shoppingItem.deleteMany({ where: { weekStart } })

      if (aggregated.size > 0) {
        await prisma.shoppingItem.createMany({
          data: Array.from(aggregated.entries()).map(
            ([ingredientId, { amount, unit }]) => ({
              ingredientId,
              amount,
              unit,
              weekStart,
              isBought: boughtMap.get(ingredientId) ?? false,
            })
          ),
        })
      }

      items = await prisma.shoppingItem.findMany({
        where: { weekStart },
        include: { ingredient: true },
        orderBy: { ingredient: { name: 'asc' } },
      })
    }

    return NextResponse.json({
      weekStart: format(weekStart, 'yyyy-MM-dd'),
      items,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Ошибка загрузки списка покупок' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/shopping
 * body: { id, isBought } — одна галочка
 * или { week, isBought } — отметить все / снять все
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json()

    if (body.id != null && typeof body.isBought === 'boolean') {
      const item = await prisma.shoppingItem.update({
        where: { id: body.id },
        data: { isBought: body.isBought },
        include: { ingredient: true },
      })
      return NextResponse.json(item)
    }

    if (body.week != null && typeof body.isBought === 'boolean') {
      const weekStart = getWeekStart(body.week)
      await prisma.shoppingItem.updateMany({
        where: { weekStart },
        data: { isBought: body.isBought },
      })
      const items = await prisma.shoppingItem.findMany({
        where: { weekStart },
        include: { ingredient: true },
        orderBy: { ingredient: { name: 'asc' } },
      })
      return NextResponse.json({ items })
    }

    return NextResponse.json(
      { error: 'Нужны id + isBought или week + isBought' },
      { status: 400 }
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Ошибка обновления' }, { status: 500 })
  }
}