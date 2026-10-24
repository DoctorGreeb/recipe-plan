import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import RecipeFilters from './RecipeFilters'

interface Props {
  searchParams: Promise<{ q?: string; category?: string; ingredient?: string }>
}

export default async function RecipesPage({ searchParams }: Props) {
  const { q, category, ingredient } = await searchParams

  const where: { status: string; category?: string } = {
    status: 'published',
  }

  if (category && category !== 'all') {
    where.category = category
  }

  const all = await prisma.recipe.findMany({
    where,
    orderBy: { title: 'asc' },
    include: {
      ingredients: {
        include: { ingredient: true },
      },
    },
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

  const categories = await prisma.recipe.findMany({
    select: { category: true },
    distinct: ['category'],
  })

  const ingredientsList = await prisma.ingredient.findMany({
    select: { name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="page">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Каталог рецептов</h1>
          <Link href="/" className="link text-sm">
            ← На главную
          </Link>
        </div>

        <RecipeFilters
          initialQ={q || ''}
          initialCategory={category || 'all'}
          initialIngredient={ingredient || ''}
          categories={categories.map((c) => c.category)}
          ingredients={ingredientsList.map((i) => i.name)}
        />

        <p className="text-sm text-muted mb-4">
          Найдено: {recipes.length}
        </p>

        {recipes.length === 0 ? (
          <div className="text-center py-12 text-muted">
            Рецепты не найдены. Попробуйте изменить фильтры.
          </div>
        ) : (
          <div className="grid gap-4">
            {recipes.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="card block hover:shadow-md transition"
              >
                <h2 className="text-xl font-semibold">{recipe.title}</h2>
                <p className="text-secondary mt-1">{recipe.description}</p>
                <div className="mt-3 flex gap-3 text-sm text-muted">
                  <span className="badge">{recipe.category}</span>
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