import { prisma } from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  const category = searchParams.get('category')
  const ingredient = searchParams.get('ingredient')

  const where: { status: string; category?: string } = {
    status: 'published',
  }

  if (category && category !== 'all') {
    where.category = category
  }

  const all = await prisma.recipe.findMany({
    where,
    include: {
      ingredients: {
        include: { ingredient: true },
      },
    },
    orderBy: { title: 'asc' },
  })

  const qNorm = q?.trim().toLowerCase() ?? ''
  const ingNorm = ingredient?.trim().toLowerCase() ?? ''

  const recipes = all.filter((recipe) => {
    if (qNorm && !recipe.title.toLowerCase().includes(qNorm)) {
      return false
    }
    if (
      ingNorm &&
      !recipe.ingredients.some((ri) =>
        ri.ingredient.name.toLowerCase().includes(ingNorm)
      )
    ) {
      return false
    }
    return true
  })

  return NextResponse.json(recipes)
}