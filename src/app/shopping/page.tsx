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

interface ShoppingItem {
    id: string
    amount: number
    unit: string
    isBought: boolean
    ingredient: {
        id: string
        name: string
        unit: string
    }
}

function getMonday(date: Date): Date {
    const monday = startOfWeek(date, { weekStartsOn: 1 })
    monday.setHours(0, 0, 0, 0)
    return monday
}

function formatAmount(amount: number): string {
    // аккуратнее для float: 550, 1.5, без лишних нулей
    return Number.isInteger(amount)
        ? String(amount)
        : String(Math.round(amount * 100) / 100)
}

export default function ShoppingPage() {
    const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
    const [items, setItems] = useState<ShoppingItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [rebuilding, setRebuilding] = useState(false)

    const weekKey = format(weekStart, 'yyyy-MM-dd')

    const loadList = useCallback(
        async (rebuild = false) => {
            setLoading(true)
            setError('')
            try {
                const q = rebuild ? `&rebuild=1` : ''
                const res = await fetch(`/api/shopping?week=${weekKey}${q}`)
                if (!res.ok) throw new Error('Не удалось загрузить список')
                const data = await res.json()
                setItems(data.items ?? [])
            } catch {
                setError('Ошибка загрузки списка покупок')
                setItems([])
            } finally {
                setLoading(false)
                setRebuilding(false)
            }
        },
        [weekKey]
    )

    useEffect(() => {
        loadList(false)
    }, [loadList])

    function shiftWeek(delta: number) {
        setWeekStart((prev) => getMonday(addWeeks(prev, delta)))
    }

    function goToCurrentWeek() {
        setWeekStart(getMonday(new Date()))
    }

    async function toggleItem(id: string, isBought: boolean) {
        // оптимистичное обновление
        setItems((prev) =>
            prev.map((i) => (i.id === id ? { ...i, isBought } : i))
        )
        const res = await fetch('/api/shopping', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, isBought }),
        })
        if (!res.ok) {
            // откат
            setItems((prev) =>
                prev.map((i) => (i.id === id ? { ...i, isBought: !isBought } : i))
            )
        }
    }

    async function setAllBought(isBought: boolean) {
        setItems((prev) => prev.map((i) => ({ ...i, isBought })))
        const res = await fetch('/api/shopping', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ week: weekKey, isBought }),
        })
        if (!res.ok) {
            loadList(false)
        }
    }

    function handleRebuild() {
        setRebuilding(true)
        loadList(true)
    }

    const weekEnd = addDays(weekStart, 6)
    const rangeLabel = `${format(weekStart, 'd MMM', { locale: ru })} — ${format(weekEnd, 'd MMM yyyy', { locale: ru })}`

    const remaining = items.filter((i) => !i.isBought)
    const bought = items.filter((i) => i.isBought)

    return (
        <div className="page">
            <div className="mx-auto w-full max-w-3xl">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4 sm:mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Список покупок</h1>
                        <p className="text-secondary mt-1">{rangeLabel}</p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm">
                        <Link href="/menu" className="link">
                            Меню
                        </Link>
                        <Link href="/" className="link">
                            ← На главную
                        </Link>
                    </div>
                </div>

                {/* Навигация по неделям — только она */}
                <div className="card mb-4 flex flex-wrap items-center gap-3">
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
                ) : items.length === 0 ? (
                    <div className="card text-center py-10">
                        <p className="text-muted mb-2">Список пуст</p>
                        <p className="text-sm text-secondary mb-4">
                            Добавьте блюда в{' '}
                            <Link href="/menu" className="link">
                                меню на неделю
                            </Link>
                            , затем обновите список.
                        </p>
                        <button
                            type="button"
                            onClick={handleRebuild}
                            disabled={rebuilding}
                            className="btn btn-primary"
                        >
                            {rebuilding ? 'Обновление...' : 'Собрать из меню'}
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Действия над списком — отдельная строка */}
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-(--border) bg-white p-4">
                            <span className="text-sm text-muted">
                                Осталось: {remaining.length} · Куплено: {bought.length}
                            </span>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={handleRebuild}
                                    disabled={rebuilding}
                                    className="btn btn-outline text-sm"
                                    title="Пересчитать количества по текущему меню"
                                >
                                    {rebuilding ? 'Обновление...' : 'Обновить по меню'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAllBought(true)}
                                    className="btn btn-outline text-sm"
                                >
                                    Отметить все
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAllBought(false)}
                                    className="btn btn-outline text-sm"
                                >
                                    Снять все
                                </button>
                            </div>
                        </div>

                        {remaining.length > 0 && (
                            <section className="card mb-4">
                                <h2 className="text-lg font-semibold mb-3">Нужно купить</h2>
                                <ul className="space-y-2">
                                    {remaining.map((item) => (
                                        <li key={item.id}>
                                            <label className="flex items-center gap-3 cursor-pointer py-1">
                                                <input
                                                    type="checkbox"
                                                    checked={false}
                                                    onChange={() => toggleItem(item.id, true)}
                                                    className="w-4 h-4 accent-(--color-primary)"
                                                />
                                                <span className="flex-1 font-medium">
                                                    {item.ingredient.name}
                                                </span>
                                                <span className="text-secondary text-sm tabular-nums">
                                                    {formatAmount(item.amount)} {item.unit}
                                                </span>
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {bought.length > 0 && (
                            <section className="card opacity-80">
                                <h2 className="text-lg font-semibold mb-3 text-muted">Куплено</h2>
                                <ul className="space-y-2">
                                    {bought.map((item) => (
                                        <li key={item.id}>
                                            <label className="flex items-center gap-3 cursor-pointer py-1">
                                                <input
                                                    type="checkbox"
                                                    checked={true}
                                                    onChange={() => toggleItem(item.id, false)}
                                                    className="w-4 h-4 accent-(--color-primary)"
                                                />
                                                <span className="flex-1 text-muted line-through">
                                                    {item.ingredient.name}
                                                </span>
                                                <span className="text-muted text-sm tabular-nums">
                                                    {formatAmount(item.amount)} {item.unit}
                                                </span>
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}