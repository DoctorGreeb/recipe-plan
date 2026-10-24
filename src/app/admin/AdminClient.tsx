'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface IngredientItem {
  id: string
  amount: number
  ingredient: {
    id: string
    name: string
    unit: string
  }
}

interface Recipe {
  id: string
  title: string
  description: string | null
  calories: number | null
  instructions: string
  category: string
  ingredients: IngredientItem[]
}

const CATEGORIES = ['завтрак', 'обед', 'ужин', 'десерт', 'перекус', 'напиток']

export default function AdminClient() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  // Форма
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [calories, setCalories] = useState('')
  const [instructions, setInstructions] = useState('')
  const [ingredientName, setIngredientName] = useState('')
  const [ingredientAmount, setIngredientAmount] = useState('')
  const [ingredients, setIngredients] = useState<{ name: string; amount: number }[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function fetchRecipes() {
      try {
        const res = await fetch('/api/admin/recipes')
        if (!res.ok) throw new Error('Не удалось загрузить рецепты')
        const data = await res.json()
        setRecipes(data)
      } catch {
        setError('Ошибка загрузки данных')
      } finally {
        setLoading(false)
      }
    }

    fetchRecipes()
  }, [])

  async function handleDelete(id: string) {
    if (!confirm('Удалить этот рецепт?')) return

    const res = await fetch(`/api/admin/recipes?id=${id}`, {
      method: 'DELETE',
    })

    if (res.ok) {
      setRecipes((prev) => prev.filter((r) => r.id !== id))
    } else {
      alert('Ошибка при удалении')
    }
  }

  function addIngredient() {
    const name = ingredientName.trim()
    const amount = Number(ingredientAmount)

    if (name && amount > 0) {
      setIngredients((prev) => [...prev, { name, amount }])
      setIngredientName('')
      setIngredientAmount('')
    }
  }

  function removeIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/admin/recipes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          calories,
          instructions,
          ingredients,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ошибка')
      }

      const newRecipe = await res.json()
      setRecipes((prev) => [newRecipe, ...prev])

      // Очистка формы
      setTitle('')
      setDescription('')
      setCalories('')
      setInstructions('')
      setIngredients([])
      setIngredientName('')
      setIngredientAmount('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при сохранении')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Загрузка...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl text-gray-600 font-bold">Админка рецептов</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Выйти
          </button>
        </div>

        {/* Форма добавления */}
        <div className="text-gray-600 rounded-xl shadow p-6 mb-10">
          <h2 className="text-xl font-semibold mb-4">Добавить рецепт</h2>

          {error && <p className="text-red-500 mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Название *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Описание</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Категория *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Калории</label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Инструкция</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                rows={4}
              />
            </div>

            {/* Ингредиенты */}
            <div>
              <label className="block text-sm font-medium mb-1">Ингредиенты</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={ingredientName}
                  onChange={(e) => setIngredientName(e.target.value)}
                  placeholder="Название"
                  className="flex-1 border rounded-lg px-3 py-2"
                />
                <input
                  type="number"
                  value={ingredientAmount}
                  onChange={(e) => setIngredientAmount(e.target.value)}
                  placeholder="Кол-во"
                  className="w-28 border rounded-lg px-3 py-2"
                  min="0"
                  step="0.1"
                />
                <button
                  type="button"
                  onClick={addIngredient}
                  className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-300"
                >
                  Добавить
                </button>
              </div>

              {ingredients.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {ingredients.map((ing, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      {ing.name} — {ing.amount} г
                      <button
                        type="button"
                        onClick={() => removeIngredient(i)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-gray-600 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Сохраняем...' : 'Добавить рецепт'}
            </button>
          </form>
        </div>

        {/* Список рецептов */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl text-gray-600 font-semibold mb-4">
            Все рецепты ({recipes.length})
          </h2>

          {recipes.length === 0 ? (
            <p className="text-gray-500">Пока нет рецептов</p>
          ) : (
            <div className="space-y-4">
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="border rounded-lg p-4 flex justify-between items-start gap-4"
                >
                  <div>
                    <h3 className="font-semibold text-gray-600 text-lg">{recipe.title}</h3>
                    <p className="text-sm text-gray-500">
                      {recipe.category} · {recipe.calories ?? '—'} ккал
                    </p>
                    {recipe.description && (
                      <p className="text-sm mt-1 text-gray-700 line-clamp-2">
                        {recipe.description}
                      </p>
                    )}
                    {recipe.ingredients?.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Ингредиенты:{' '}
                        {recipe.ingredients
                          .map(
                            (i) =>
                              `${i.ingredient.name} (${i.amount}${i.ingredient.unit})`
                          )
                          .join(', ')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(recipe.id)}
                    className="shrink-0 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}