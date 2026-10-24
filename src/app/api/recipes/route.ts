import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET /api/recipes — список всех рецептов
export async function GET() {
  const recipes = await prisma.recipe.findMany({
    include: {
      ingredients: {
        include: { ingredient: true },
      },
    },
    orderBy: { title: 'asc' },
  })
  return NextResponse.json(recipes)
}