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

  const [editingId, setEditingId] = useState<string | null>(null)

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
    fetchRecipes()
  }, [])

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

  function resetForm() {
    setEditingId(null)
    setTitle('')
    setDescription('')
    setCategory(CATEGORIES[0])
    setCalories('')
    setInstructions('')
    setIngredients([])
    setIngredientName('')
    setIngredientAmount('')
    setError('')
  }

  function startEdit(recipe: Recipe) {
    setEditingId(recipe.id)
    setTitle(recipe.title)
    setDescription(recipe.description || '')
    setCategory(recipe.category)
    setCalories(recipe.calories?.toString() || '')
    setInstructions(recipe.instructions || '')
    setIngredients(
      recipe.ingredients.map((i) => ({
        name: i.ingredient.name,
        amount: i.amount,
      }))
    )
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить этот рецепт?')) return

    const res = await fetch(`/api/admin/recipes?id=${id}`, { method: 'DELETE' })

    if (res.ok) {
      setRecipes((prev) => prev.filter((r) => r.id !== id))
      if (editingId === id) resetForm()
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

    const payload = {
      title,
      description,
      category,
      calories,
      instructions,
      ingredients,
    }

    try {
      const url = editingId ? '/api/admin/recipes' : '/api/admin/recipes/create'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ошибка')
      }

      const saved = await res.json()

      if (editingId) {
        setRecipes((prev) => prev.map((r) => (r.id === editingId ? saved : r)))
      } else {
        setRecipes((prev) => [saved, ...prev])
      }

      resetForm()
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
      <div className="page flex items-center justify-center">
        <p>Загрузка...</p>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Админка рецептов</h1>
          <button onClick={handleLogout} className="btn btn-danger">
            Выйти
          </button>
        </div>

        <div className="card mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {editingId ? 'Редактировать рецепт' : 'Добавить рецепт'}
            </h2>
            {editingId && (
              <button type="button" onClick={resetForm} className="text-sm text-muted hover:text-primary">
                Отмена
              </button>
            )}
          </div>

          {error && <p className="text-red-500 mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Название *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input" required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Описание</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input" rows={2} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Категория *</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="input" required>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Калории</label>
                <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} className="input" min="0" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Инструкция</label>
              <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} className="input" rows={4} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Ингредиенты</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={ingredientName}
                  onChange={(e) => setIngredientName(e.target.value)}
                  placeholder="Название"
                  className="input flex-1"
                />
                <input
                  type="number"
                  value={ingredientAmount}
                  onChange={(e) => setIngredientAmount(e.target.value)}
                  placeholder="Кол-во"
                  className="input w-28"
                  min="0"
                  step="0.1"
                />
                <button type="button" onClick={addIngredient} className="btn btn-outline">
                  Добавить
                </button>
              </div>

              {ingredients.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {ingredients.map((ing, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {ing.name} — {ing.amount}
                      <button type="button" onClick={() => removeIngredient(i)} className="text-blue-600 hover:text-blue-900">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={submitting} className="btn btn-primary w-full">
              {submitting ? 'Сохраняем...' : editingId ? 'Сохранить изменения' : 'Добавить рецепт'}
            </button>
          </form>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Все рецепты ({recipes.length})</h2>

          {recipes.length === 0 ? (
            <p className="text-muted">Пока нет рецептов</p>
          ) : (
            <div className="space-y-4">
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className={`border rounded-lg p-4 flex justify-between items-start gap-4 ${
                    editingId === recipe.id ? 'border-blue-400 bg-blue-50' : ''
                  }`}
                >
                  <div>
                    <h3 className="font-semibold text-lg">{recipe.title}</h3>
                    <p className="text-sm text-muted">
                      {recipe.category} · {recipe.calories ?? '—'} ккал
                    </p>
                    {recipe.description && (
                      <p className="text-sm mt-1 text-secondary line-clamp-2">{recipe.description}</p>
                    )}
                    {recipe.ingredients?.length > 0 && (
                      <p className="text-xs text-muted mt-2">
                        Ингредиенты:{' '}
                        {recipe.ingredients
                          .map((i) => `${i.ingredient.name} (${i.amount}${i.ingredient.unit})`)
                          .join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => startEdit(recipe)} className="btn btn-outline text-sm">
                      Редактировать
                    </button>
                    <button onClick={() => handleDelete(recipe.id)} className="btn btn-danger text-sm">
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
