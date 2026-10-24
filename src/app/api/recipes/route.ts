import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

// GET /api/recipes?q=&category=&ingredient=
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  const category = searchParams.get('category')
  const ingredient = searchParams.get('ingredient')

  const where: any = {}

  if (q) {
    where.title = { contains: q, mode: 'insensitive' }
  }

  if (category && category !== 'all') {
    where.category = category
  }

  if (ingredient) {
    where.ingredients = {
      some: {
        ingredient: {
          name: { contains: ingredient, mode: 'insensitive' },
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
