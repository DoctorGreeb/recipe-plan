import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import RecipeFilters from './RecipeFilters'

interface Props {
  searchParams: Promise<{ q?: string; category?: string; ingredient?: string }>
}

export default async function RecipesPage({ searchParams }: Props) {
  const { q, category, ingredient } = await searchParams

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
    orderBy: { title: 'asc' },
    include: {
      ingredients: {
        include: { ingredient: true },
      },
    },
  })

  // Уникальные категории и ингредиенты для фильтров
  const categories = await prisma.recipe.findMany({
    select: { category: true },
    distinct: ['category'],
  })

  const ingredients = await prisma.ingredient.findMany({
    select: { name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl text-gray-800 font-bold mb-6">Каталог рецептов</h1>

        <RecipeFilters
          initialQ={q || ''}
          initialCategory={category || 'all'}
          initialIngredient={ingredient || ''}
          categories={categories.map((c) => c.category)}
          ingredients={ingredients.map((i) => i.name)}
        />

        <p className="text-sm text-gray-500 mb-4">
          Найдено: {recipes.length}
        </p>

        {recipes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Рецепты не найдены. Попробуйте изменить фильтры.
          </div>
        ) : (
          <div className="grid gap-4">
            {recipes.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="block p-6 bg-white rounded-xl shadow hover:shadow-md transition"
              >
                <h2 className="text-xl text-gray-800 font-semibold">{recipe.title}</h2>
                <p className="text-gray-600 mt-1">{recipe.description}</p>
                <div className="mt-3 flex gap-3 text-sm text-gray-500">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {recipe.category}
                  </span>
                  {recipe.calories && <span>{recipe.calories} ккал</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
