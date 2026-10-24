'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

interface IngredientItem {
  id: string
  amount: number
  ingredient: { id: string; name: string; unit: string }
}

interface Recipe {
  id: string
  title: string
  description: string | null
  calories: number | null
  instructions: string
  category: string
  status: string
  ingredients: IngredientItem[]
}

const CATEGORIES = ['завтрак', 'обед', 'ужин', 'десерт', 'перекус', 'напиток']

const STATUS_LABEL: Record<string, string> = {
  draft: 'Черновик',
  pending: 'На проверке',
  published: 'Опубликован',
  rejected: 'Отклонён',
}

export default function MyRecipesClient() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
  const [sharingId, setSharingId] = useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<Recipe | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [dialogError, setDialogError] = useState('')

  const fetchRecipes = useCallback(async () => {
    try {
      const res = await fetch('/api/my-recipes')
      if (!res.ok) throw new Error('Не удалось загрузить')
      setRecipes(await res.json())
    } catch {
      setError('Ошибка загрузки рецептов')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchRecipes()
  }, [fetchRecipes])

  useEffect(() => {
    if (deleteTarget || dialogError) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [deleteTarget, dialogError])


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
      const res = await fetch('/api/my-recipes', {
        method: editingId ? 'PUT' : 'POST',
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
      setError(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/my-recipes?id=${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Ошибка удаления')
      setRecipes((prev) => prev.filter((r) => r.id !== deleteTarget.id))
      if (editingId === deleteTarget.id) resetForm()
      setDeleteTarget(null)
    } catch {
      setDeleteTarget(null)
      setDialogError('Не удалось удалить рецепт')
    } finally {
      setDeleting(false)
    }
  }

  async function share(id: string) {
    setSharingId(id)
    try {
      const res = await fetch('/api/my-recipes/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Ошибка')
      }
      const updated = await res.json()
      setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)))
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : 'Не удалось отправить')
    } finally {
      setSharingId(null)
    }
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
          <h1 className="text-3xl font-bold">Мои рецепты</h1>
          <Link href="/" className="link text-sm">
            ← На главную
          </Link>
        </div>

        <div className="card mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {editingId ? 'Редактировать' : 'Добавить свой рецепт'}
            </h2>
            {editingId && (
              <button type="button" onClick={resetForm} className="text-sm text-muted">
                Отмена
              </button>
            )}
          </div>

          {error && <p className="text-red-500 mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Название *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Описание</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input w-full"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Категория *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input w-full"
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
                  className="input w-full"
                  min="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Инструкция</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="input w-full"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ингредиенты</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={ingredientName}
                  onChange={(e) => setIngredientName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addIngredient()
                    }
                  }}
                  placeholder="Название"
                  className="input flex-1 !w-auto min-w-0"
                />
                <input
                  type="number"
                  value={ingredientAmount}
                  onChange={(e) => setIngredientAmount(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addIngredient()
                    }
                  }}
                  placeholder="Кол-во"
                  className="input !w-28 shrink-0"
                  min="0"
                  step="0.1"
                />
                <button type="button" onClick={addIngredient} className="btn btn-outline shrink-0">
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
                      {ing.name} — {ing.amount}
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
            <button type="submit" disabled={submitting} className="btn btn-primary w-full">
              {submitting ? 'Сохраняем...' : editingId ? 'Сохранить' : 'Добавить рецепт'}
            </button>
          </form>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">
            Список ({recipes.length})
          </h2>
          {recipes.length === 0 ? (
            <p className="text-muted">Пока нет своих рецептов</p>
          ) : (
            <div className="space-y-4">
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="border rounded-lg p-4 flex flex-col sm:flex-row justify-between gap-4"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-lg">{recipe.title}</h3>
                      <span className="badge">{STATUS_LABEL[recipe.status] || recipe.status}</span>
                    </div>
                    <p className="text-sm text-muted mt-1">
                      {recipe.category} · {recipe.calories ?? '—'} ккал
                    </p>
                    {recipe.description && (
                      <p className="text-sm mt-1 text-secondary line-clamp-2">
                        {recipe.description}
                      </p>
                    )}

                    {(recipe.status === 'draft' || recipe.status === 'rejected') && (
                      <div className="mt-3">
                        <p className="text-sm text-muted mb-2">
                          Рецепт появится в общем каталоге после проверки модератором.
                        </p>
                        <button
                          type="button"
                          disabled={sharingId === recipe.id}
                          onClick={() => share(recipe.id)}
                          className="btn btn-primary text-sm"
                        >
                          {sharingId === recipe.id
                            ? 'Отправка...'
                            : 'Поделиться рецептом с другими'}
                        </button>
                      </div>
                    )}

                    {recipe.status === 'pending' && (
                      <p className="text-sm text-muted mt-3">Ожидает проверки модератором.</p>
                    )}
                    {recipe.status === 'published' && (
                      <p className="text-sm text-muted mt-3">Доступен в общем каталоге.</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(recipe)}
                      className="btn btn-outline text-sm"
                    >
                      Редактировать
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(recipe)}
                      className="btn btn-danger text-sm"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgb(0 0 0 / 0.4)' }}
          onClick={() => !deleting && setDeleteTarget(null)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            className="card w-full max-w-sm shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-2">Удалить рецепт?</h2>
            <p className="text-secondary text-sm mb-6">
              «{deleteTarget.title}» будет удалён без восстановления.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="btn btn-outline"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="btn btn-danger"
              >
                {deleting ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {dialogError && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgb(0 0 0 / 0.4)' }}
          onClick={() => setDialogError('')}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            className="card w-full max-w-sm shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-2">Ошибка</h2>
            <p className="text-secondary text-sm mb-6">{dialogError}</p>
            <div className="flex justify-end">
              <button type="button" onClick={() => setDialogError('')} className="btn btn-primary">
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}