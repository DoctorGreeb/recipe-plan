import { prisma } from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  const category = searchParams.get('category')
  const ingredient = searchParams.get('ingredient')

  const where: any = {}

  // SQLite не поддерживает mode: 'insensitive'
  if (q) {
    where.title = { contains: q }
  }

  if (category && category !== 'all') {
    where.category = category
  }

  if (ingredient) {
    where.ingredients = {
      some: {
        ingredient: {
          name: { contains: ingredient },
        },
      },
    }
  }

  const recipes = await prisma.recipe.findMany({
    where,
    include: {
      ingredients: {
        include: { ingredient: true },
      },
    },
    orderBy: { title: 'asc' },
  })

  return NextResponse.json(recipes)
}
