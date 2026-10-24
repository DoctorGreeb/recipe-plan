import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export default async function RecipesPage() {
  const recipes = await prisma.recipe.findMany({
    orderBy: { title: 'asc' },
  })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl text-gray-600 font-bold mb-8">Каталог рецептов</h1>

        <div className="grid gap-4">
          {recipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="block p-6 bg-white rounded-xl shadow hover:shadow-md transition"
            >
              <h2 className="text-xl text-gray-600 font-semibold">{recipe.title}</h2>
              <p className="text-gray-600 mt-1">{recipe.description}</p>
              <div className="mt-3 flex gap-3 text-sm text-gray-500">
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {recipe.category}
                </span>
                {recipe.calories && (
                  <span>{recipe.calories} ккал</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}