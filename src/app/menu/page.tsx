'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  addWeeks,
  format,
  startOfWeek,
  addDays,
} from 'date-fns'
import { ru } from 'date-fns/locale'

type MealType = 'breakfast' | 'lunch' | 'dinner'

interface MenuRecipe {
  id: string
  title: string
  category: string
  calories: number | null
}

interface MenuItem {
  id: string
  dayOfWeek: number
  mealType: MealType
  recipe: MenuRecipe
}

interface RecipeOption {
  id: string
  title: string
  category: string
  calories: number | null
  description: string | null
}

const MEALS: { type: MealType; label: string }[] = [
  { type: 'breakfast', label: 'Завтрак' },
  { type: 'lunch', label: 'Обед' },
  { type: 'dinner', label: 'Ужин' },
]

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function getMonday(date: Date): Date {
  const monday = startOfWeek(date, { weekStartsOn: 1 })
  monday.setHours(0, 0, 0, 0)
  return monday
}

export default function MenuPage() {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Панель выбора рецепта (внутри страницы)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerDay, setPickerDay] = useState(0)
  const [pickerMeal, setPickerMeal] = useState<MealType>('breakfast')
  const [recipes, setRecipes] = useState<RecipeOption[]>([])
  const [recipesLoading, setRecipesLoading] = useState(false)
  const [recipeQuery, setRecipeQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [pickerError, setPickerError] = useState('')

  // Подтверждение удаления (тоже внутри страницы)
  const [clearTarget, setClearTarget] = useState<{
    day: number
    meal: MealType
    title: string
  } | null>(null)
  const [clearing, setClearing] = useState(false)

  const weekKey = format(weekStart, 'yyyy-MM-dd')

  const loadMenu = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/menu?week=${weekKey}`)
      if (!res.ok) throw new Error('Не удалось загрузить меню')
      const data = await res.json()
      setItems(data.items ?? [])
    } catch {
      setError('Ошибка загрузки меню')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [weekKey])

  useEffect(() => {
    loadMenu()
  }, [loadMenu])

  // Блокировка прокрутки фона, пока открыта панель
  useEffect(() => {
    if (pickerOpen || clearTarget) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [pickerOpen, clearTarget])

  function shiftWeek(delta: number) {
    setWeekStart((prev) => getMonday(addWeeks(prev, delta)))
  }

  function goToCurrentWeek() {
    setWeekStart(getMonday(new Date()))
  }

  function findItem(dayOfWeek: number, mealType: MealType): MenuItem | undefined {
    return items.find((i) => i.dayOfWeek === dayOfWeek && i.mealType === mealType)
  }

  async function openPicker(dayOfWeek: number, mealType: MealType) {
    setPickerDay(dayOfWeek)
    setPickerMeal(mealType)
    setRecipeQuery('')
    setPickerError('')
    setPickerOpen(true)
    setRecipesLoading(true)
    try {
      const res = await fetch('/api/recipes')
      if (!res.ok) throw new Error('Не удалось загрузить рецепты')
      const data = await res.json()
      setRecipes(Array.isArray(data) ? data : data.recipes ?? [])
    } catch {
      setRecipes([])
      setPickerError('Не удалось загрузить список рецептов')
    } finally {
      setRecipesLoading(false)
    }
  }

  function closePicker() {
    if (saving) return
    setPickerOpen(false)
    setPickerError('')
  }

  async function assignRecipe(recipeId: string) {
    setSaving(true)
    setPickerError('')
    try {
      const res = await fetch('/api/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId,
          dayOfWeek: pickerDay,
          mealType: pickerMeal,
          week: weekKey,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Ошибка сохранения')
      }
      const saved: MenuItem = await res.json()
      setItems((prev) => {
        const without = prev.filter(
          (i) => !(i.dayOfWeek === pickerDay && i.mealType === pickerMeal)
        )
        return [...without, saved]
      })
      setPickerOpen(false)
    } catch (err) {
      setPickerError(err instanceof Error ? err.message : 'Не удалось назначить рецепт')
    } finally {
      setSaving(false)
    }
  }

  function requestClear(day: number, meal: MealType, title: string) {
    setClearTarget({ day, meal, title })
  }

  async function confirmClear() {
    if (!clearTarget) return
    setClearing(true)
    try {
      const res = await fetch('/api/menu', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayOfWeek: clearTarget.day,
          mealType: clearTarget.meal,
          week: weekKey,
        }),
      })
      if (!res.ok) throw new Error('Не удалось удалить')
      setItems((prev) =>
        prev.filter(
          (i) =>
            !(i.dayOfWeek === clearTarget.day && i.mealType === clearTarget.meal)
        )
      )
      setClearTarget(null)
    } catch {
      setError('Не удалось убрать блюдо из слота')
      setClearTarget(null)
    } finally {
      setClearing(false)
    }
  }

  const filteredRecipes = recipes.filter((r) => {
    if (!recipeQuery.trim()) return true
    const q = recipeQuery.trim().toLowerCase()
    return (
      r.title.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
    )
  })

  const weekEnd = addDays(weekStart, 6)
  const rangeLabel = `${format(weekStart, 'd MMM', { locale: ru })} — ${format(weekEnd, 'd MMM yyyy', { locale: ru })}`
  const mealLabel = MEALS.find((m) => m.type === pickerMeal)?.label ?? pickerMeal
  const dayLabel = `${DAY_LABELS[pickerDay]}, ${format(addDays(weekStart, pickerDay), 'd MMM', { locale: ru })}`

  return (
    <div className="page">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 sm:mb-8">
          <div>
            <h1 className="text-3xl font-bold">Меню на неделю</h1>
            <p className="text-secondary mt-1">{rangeLabel}</p>
          </div>
          <Link href="/" className="link text-sm">
            ← На главную
          </Link>
        </div>

        <div className="card mb-6 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => shiftWeek(-1)} className="btn btn-outline">
            ← Пред. неделя
          </button>
          <button type="button" onClick={goToCurrentWeek} className="btn btn-outline">
            Текущая
          </button>
          <button type="button" onClick={() => shiftWeek(1)} className="btn btn-outline">
            След. неделя →
          </button>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {loading ? (
          <p className="text-muted">Загрузка...</p>
        ) : (
          <>
            <section className="mb-4 grid gap-3 md:hidden" aria-label="План меню по дням">
              {DAY_LABELS.map((label, day) => {
                const date = addDays(weekStart, day)
                return (
                  <article key={day} className="card">
                    <div className="mb-3 flex items-center justify-between gap-3 border-b border-(--border) pb-3">
                      <h2 className="font-bold">{label}</h2>
                      <span className="text-sm text-muted">{format(date, 'd MMM', { locale: ru })}</span>
                    </div>
                    <div className="grid gap-2">
                      {MEALS.map(({ type, label: mealName }) => {
                        const item = findItem(day, type)
                        return (
                          <div key={type} className="flex min-w-0 items-stretch gap-2">
                            <button
                              type="button"
                              onClick={() => openPicker(day, type)}
                              className="flex min-h-12 min-w-0 flex-1 items-center justify-between gap-3 rounded-xl border border-(--border) bg-(--bg-muted) px-3 py-2 text-left transition hover:border-(--color-primary) hover:bg-(--color-primary-soft)"
                            >
                              <span className="min-w-0">
                                <span className="block text-xs font-semibold text-muted">{mealName}</span>
                                <span className="mt-0.5 block break-words text-sm font-medium">{item?.recipe.title || '＋ Добавить блюдо'}</span>
                                {item?.recipe.calories != null && <span className="mt-0.5 block text-xs text-muted">{item.recipe.calories} ккал</span>}
                              </span>
                              <span className="shrink-0 text-(--color-primary)" aria-hidden="true">→</span>
                            </button>
                            {item && (
                              <button
                                type="button"
                                onClick={() => requestClear(day, type, item.recipe.title)}
                                className="btn btn-outline self-center px-3"
                                aria-label={`Убрать ${item.recipe.title} из меню`}
                                title="Убрать блюдо"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </article>
                )
              })}
            </section>
            <div className="hidden overflow-x-auto md:block" aria-label="План меню на неделю">
              <table className="w-full border-collapse min-w-160">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-sm text-muted w-24">Приём</th>
                    {DAY_LABELS.map((label, day) => {
                      const date = addDays(weekStart, day)
                      return (
                        <th key={day} className="p-2 text-center text-sm font-medium">
                          <div>{label}</div>
                          <div className="text-muted font-normal text-xs">
                            {format(date, 'd.MM')}
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {MEALS.map(({ type, label }) => (
                    <tr key={type} className="border-t border-(--border)">
                      <td className="p-2 text-sm font-medium align-top pt-3">{label}</td>
                      {DAY_LABELS.map((_, day) => {
                        const item = findItem(day, type)
                        return (
                          <td key={day} className="p-1.5 align-top">
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => openPicker(day, type)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  openPicker(day, type)
                                }
                              }}
                              className={[
                                'rounded-lg border min-h-18 p-2 text-sm transition cursor-pointer',
                                'hover:border-(--color-primary) hover:shadow-sm',
                                item
                                  ? 'bg-(--bg-card) border-(--border)'
                                  : 'bg-(--bg-muted) border-dashed border-(--border)',
                              ].join(' ')}
                            >
                              {item ? (
                                <div className="flex flex-col gap-1">
                                  <span className="font-medium leading-snug">
                                    {item.recipe.title}
                                  </span>
                                  {item.recipe.calories != null && (
                                    <span className="text-xs text-muted">
                                      {item.recipe.calories} ккал
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      requestClear(day, type, item.recipe.title)
                                    }}
                                    className="text-xs text-muted hover:text-red-600 text-left mt-1"
                                  >
                                    Убрать
                                  </button>
                                </div>
                              ) : (
                                <span className="text-muted text-xs">+ Добавить</span>
                              )}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Выбор рецепта — оверлей сайта */}
      {pickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgb(0 0 0 / 0.4)' }}
          onClick={closePicker}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="picker-title"
            className="card w-full sm:max-w-lg max-h-[85vh] sm:max-h-[80vh] flex flex-col rounded-t-2xl sm:rounded-xl shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start gap-3 mb-4">
              <div>
                <h2 id="picker-title" className="text-xl font-semibold">
                  Выберите рецепт
                </h2>
                <p className="text-sm text-muted mt-1">
                  {dayLabel} · {mealLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={closePicker}
                disabled={saving}
                className="btn btn-outline text-sm px-3 py-1 shrink-0"
              >
                Закрыть
              </button>
            </div>

            <input
              type="text"
              value={recipeQuery}
              onChange={(e) => setRecipeQuery(e.target.value)}
              placeholder="Поиск по названию или категории..."
              className="input w-full mb-3"
              autoFocus
            />

            {pickerError && (
              <p className="text-sm text-red-500 mb-3">{pickerError}</p>
            )}

            <div className="overflow-y-auto flex-1 min-h-0 space-y-2 -mx-1 px-1">
              {recipesLoading ? (
                <p className="text-muted text-sm py-8 text-center">Загрузка рецептов...</p>
              ) : filteredRecipes.length === 0 ? (
                <p className="text-muted text-sm py-8 text-center">
                  Рецепты не найдены. Добавьте их в админке.
                </p>
              ) : (
                filteredRecipes.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    disabled={saving}
                    onClick={() => assignRecipe(r.id)}
                    className="w-full text-left rounded-lg border border-(--border) p-3 hover:border-(--color-primary) hover:bg-(--bg-muted) transition disabled:opacity-50"
                  >
                    <div className="font-medium">{r.title}</div>
                    <div className="text-xs text-muted mt-1 flex flex-wrap gap-2 items-center">
                      <span className="badge">{r.category}</span>
                      {r.calories != null && <span>{r.calories} ккал</span>}
                    </div>
                    {r.description && (
                      <p className="text-sm text-secondary mt-1 line-clamp-2">
                        {r.description}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>

            {saving && (
              <p className="text-sm text-muted text-center mt-3">Сохранение...</p>
            )}
          </div>
        </div>
      )}

      {/* Подтверждение удаления — тоже внутри сайта */}
      {clearTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgb(0 0 0 / 0.4)' }}
          onClick={() => !clearing && setClearTarget(null)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-title"
            className="card w-full max-w-sm shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="clear-title" className="text-lg font-semibold mb-2">
              Убрать из меню?
            </h2>
            <p className="text-secondary text-sm mb-6">
              «{clearTarget.title}» будет удалено из выбранного слота. Рецепт в каталоге
              останется.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                disabled={clearing}
                onClick={() => setClearTarget(null)}
                className="btn btn-outline"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={clearing}
                onClick={confirmClear}
                className="btn btn-danger"
              >
                {clearing ? 'Удаление...' : 'Убрать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}