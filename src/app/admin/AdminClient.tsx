'use client'

import { useCallback, useEffect, useState } from 'react'
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
  status?: string
  ingredients: IngredientItem[]
}

interface PendingRecipe extends Recipe {
  author: { id: string; email: string; name: string | null } | null
}

const CATEGORIES = ['завтрак', 'обед', 'ужин', 'десерт', 'перекус', 'напиток']

type Tab = 'recipes' | 'moderation'

export default function AdminClient() {
  const [tab, setTab] = useState<Tab>('recipes')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [pending, setPending] = useState<PendingRecipe[]>([])
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

  const [deleteTarget, setDeleteTarget] = useState<Recipe | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [dialogError, setDialogError] = useState('')
  const [moderatingId, setModeratingId] = useState<string | null>(null)

  const loadRecipes = useCallback(async () => {
    const res = await fetch('/api/admin/recipes')
    if (!res.ok) throw new Error('Не удалось загрузить рецепты')
    setRecipes(await res.json())
  }, [])

  const loadPending = useCallback(async () => {
    const res = await fetch('/api/admin/moderation')
    if (!res.ok) throw new Error('Не удалось загрузить модерацию')
    setPending(await res.json())
  }, [])

  useEffect(() => {
    async function init() {
      try {
        await Promise.all([loadRecipes(), loadPending()])
      } catch {
        setError('Ошибка загрузки данных')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [loadRecipes, loadPending])

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
    setTab('recipes')
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

  function requestDelete(recipe: Recipe) {
    setDeleteTarget(recipe)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/recipes?id=${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Ошибка при удалении')
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

  async function moderate(id: string, action: 'approve' | 'reject') {
    setModeratingId(id)
    try {
      const res = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Ошибка')
      }
      setPending((prev) => prev.filter((r) => r.id !== id))
      if (action === 'approve') {
        await loadRecipes()
      }
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : 'Ошибка модерации')
    } finally {
      setModeratingId(null)
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
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 sm:mb-8">
          <h1 className="text-3xl font-bold">Админка рецептов</h1>
          <button type="button" onClick={handleLogout} className="btn btn-danger">
            Выйти
          </button>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab('recipes')}
            className={`btn text-sm ${tab === 'recipes' ? 'btn-primary' : 'btn-outline'}`}
          >
            Рецепты
          </button>
          <button
            type="button"
            onClick={() => setTab('moderation')}
            className={`btn text-sm ${tab === 'moderation' ? 'btn-primary' : 'btn-outline'}`}
          >
            На модерации ({pending.length})
          </button>
        </div>

        {tab === 'recipes' && (
          <>
            <div className="card mb-10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {editingId ? 'Редактировать рецепт' : 'Добавить рецепт'}
                </h2>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-sm text-muted hover:text-(--color-primary)"
                  >
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
                  <div className="mb-2 flex flex-wrap gap-2">
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
                      className="input flex-1 w-auto! min-w-0"
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
                      className="input w-28! shrink-0"
                      min="0"
                      step="0.1"
                    />
                    <button
                      type="button"
                      onClick={addIngredient}
                      className="btn btn-outline shrink-0"
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
                  {submitting
                    ? 'Сохраняем...'
                    : editingId
                      ? 'Сохранить изменения'
                      : 'Добавить рецепт'}
                </button>
              </form>
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold mb-4">
                Все рецепты ({recipes.length})
              </h2>

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
                          {recipe.status ? ` · ${recipe.status}` : ''}
                        </p>
                        {recipe.description && (
                          <p className="text-sm mt-1 text-secondary line-clamp-2">
                            {recipe.description}
                          </p>
                        )}
                        {recipe.ingredients?.length > 0 && (
                          <p className="text-xs text-muted mt-2">
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
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEdit(recipe)}
                          className="btn btn-outline text-sm"
                        >
                          Редактировать
                        </button>
                        <button
                          type="button"
                          onClick={() => requestDelete(recipe)}
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
          </>
        )}

        {tab === 'moderation' && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-2">Заявки на публикацию</h2>
            <p className="text-sm text-muted mb-6">
              Рецепты пользователей, отправленные на проверку.
            </p>

            {pending.length === 0 ? (
              <p className="text-muted">Нет заявок на модерации</p>
            ) : (
              <div className="space-y-4">
                {pending.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="border rounded-lg p-4 flex flex-col sm:flex-row justify-between gap-4"
                  >
                    <div>
                      <h3 className="font-semibold text-lg">{recipe.title}</h3>
                      <p className="text-sm text-muted mt-1">
                        {recipe.category} · {recipe.calories ?? '—'} ккал
                      </p>
                      <p className="text-sm text-secondary mt-1">
                        Автор:{' '}
                        {recipe.author?.name || recipe.author?.email || 'неизвестно'}
                      </p>
                      {recipe.description && (
                        <p className="text-sm mt-2 text-secondary">{recipe.description}</p>
                      )}
                      {recipe.instructions && (
                        <p className="text-sm mt-2 whitespace-pre-line text-muted line-clamp-4">
                          {recipe.instructions}
                        </p>
                      )}
                      {recipe.ingredients?.length > 0 && (
                        <p className="text-xs text-muted mt-2">
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
                    <div className="flex flex-wrap gap-2 shrink-0 self-start">
                      <button
                        type="button"
                        disabled={moderatingId === recipe.id}
                        onClick={() => moderate(recipe.id, 'approve')}
                        className="btn btn-primary text-sm"
                      >
                        Опубликовать
                      </button>
                      <button
                        type="button"
                        disabled={moderatingId === recipe.id}
                        onClick={() => moderate(recipe.id, 'reject')}
                        className="btn btn-outline text-sm"
                      >
                        Отклонить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
              «{deleteTarget.title}» будет удалён. Связанные слоты меню тоже пропадут.
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
              <button
                type="button"
                onClick={() => setDialogError('')}
                className="btn btn-primary"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}