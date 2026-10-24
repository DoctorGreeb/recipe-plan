import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getUserId } from '@/lib/userAuth'

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const userId = await getUserId()

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      ingredients: {
        include: { ingredient: true },
      },
    },
  })

  if (!recipe) notFound()

  const isAuthor = !!userId && recipe.authorId === userId
  const isPublic = recipe.status === 'published'

  if (!isPublic && !isAuthor) {
    notFound()
  }

  return (
    <div className="page">
      <div className="max-w-3xl mx-auto">
        <Link href={isAuthor && !isPublic ? '/my-recipes' : '/recipes'} className="link mb-6 inline-block">
          {isAuthor && !isPublic ? '← К моим рецептам' : '← Назад к каталогу'}
        </Link>

        <h1 className="text-3xl font-bold mb-2">{recipe.title}</h1>
        <p className="text-secondary mb-4">{recipe.description}</p>

        <div className="flex flex-wrap gap-4 text-sm mb-8">
          <span className="badge">{recipe.category}</span>
          {recipe.calories != null && (
            <span className="badge" style={{ background: '#d1fae5', color: '#065f46' }}>
              {recipe.calories} ккал
            </span>
          )}
          {isAuthor && recipe.status !== 'published' && (
            <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>
              {recipe.status === 'draft' && 'Черновик'}
              {recipe.status === 'pending' && 'На проверке'}
              {recipe.status === 'rejected' && 'Отклонён'}
            </span>
          )}
        </div>

        <section className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Ингредиенты</h2>
          <ul className="space-y-2">
            {recipe.ingredients.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span>{item.ingredient.name}</span>
                <span className="text-secondary">
                  {item.amount} {item.ingredient.unit}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2 className="text-xl font-semibold mb-4">Приготовление</h2>
          <div className="whitespace-pre-line text-secondary">
            {recipe.instructions}
          </div>
        </section>
      </div>
    </div>
  )
}