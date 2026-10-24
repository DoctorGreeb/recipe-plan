import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      ingredients: {
        include: { ingredient: true },
      },
    },
  })

  if (!recipe) notFound()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/recipes" className="text-blue-600 hover:underline mb-6 inline-block">
          ← Назад к каталогу
        </Link>

        <h1 className="text-3xl font-bold mb-2">{recipe.title}</h1>
        <p className="text-gray-600 mb-4">{recipe.description}</p>

        <div className="flex gap-4 text-sm mb-8">
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
            {recipe.category}
          </span>
          {recipe.calories && (
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">
              {recipe.calories} ккал
            </span>
          )}
        </div>

        {/* Ингредиенты */}
        <section className="bg-white rounded-xl p-6 shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Ингредиенты</h2>
          <ul className="space-y-2">
            {recipe.ingredients.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span>{item.ingredient.name}</span>
                <span className="text-gray-600">
                  {item.amount} {item.ingredient.unit}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Инструкция */}
        <section className="bg-white rounded-xl p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">Приготовление</h2>
          <div className="whitespace-pre-line text-gray-700">
            {recipe.instructions}
          </div>
        </section>
      </div>
    </div>
  )
}