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
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 sm:mb-8">
          <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">Найдите своё блюдо</p><h1 className="text-3xl font-bold">Каталог рецептов</h1><p className="mt-2 text-sm text-secondary">Идеи для завтрака, обеда, ужина и не только.</p></div>
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="recipe-card group"
              >
                <div className="mb-4 flex items-center justify-between gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-lg text-[var(--color-primary)]" aria-hidden="true">✳</span><span className="text-xs font-semibold uppercase tracking-wide text-muted">Рецепт</span></div><h2 className="text-xl font-bold transition-colors group-hover:text-[var(--color-primary)]">{recipe.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-secondary">{recipe.description || "Простой рецепт, который стоит попробовать."}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
                  <span className="badge">{recipe.category}</span>
                  {recipe.calories != null && <span className="rounded-full bg-[var(--bg-muted)] px-3 py-1 text-xs font-medium">{recipe.calories} ккал</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}