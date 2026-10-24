'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

interface Props {
  initialQ: string
  initialCategory: string
  initialIngredient: string
  categories: string[]
  ingredients: string[]
}

export default function RecipeFilters({
  initialQ,
  initialCategory,
  initialIngredient,
  categories,
  ingredients,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [q, setQ] = useState(initialQ)
  const [category, setCategory] = useState(initialCategory)
  const [ingredient, setIngredient] = useState(initialIngredient)

  function applyFilters() {
    const params = new URLSearchParams(searchParams.toString())

    if (q.trim()) params.set('q', q.trim())
    else params.delete('q')

    if (category && category !== 'all') params.set('category', category)
    else params.delete('category')

    if (ingredient.trim()) params.set('ingredient', ingredient.trim())
    else params.delete('ingredient')

    router.push(`/recipes?${params.toString()}`)
  }

  function reset() {
    setQ('')
    setCategory('all')
    setIngredient('')
    router.push('/recipes')
  }

  return (
    <div className="recipe-filters">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Поиск по названию
          </label>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            placeholder="Блины, курица..."
            className="input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Категория
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="all">Все категории</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ингредиент
          </label>
          <input
            type="text"
            list="ingredients-list"
            value={ingredient}
            onChange={(e) => setIngredient(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            placeholder="Мука, курица..."
            className="w-full border rounded-lg px-3 py-2"
          />
          <datalist id="ingredients-list">
            {ingredients.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="recipe-filter-actions">
        <button
          onClick={applyFilters}
          className="btn btn-primary"
        >
          Найти
        </button>
        <button
          onClick={reset}
          className="btn btn-outline"
        >
          Сброс
        </button>
      </div>
    </div>
  )
}
