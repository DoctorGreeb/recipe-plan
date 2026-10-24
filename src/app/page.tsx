import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/userAuth'
import LogoutButton from './LogoutButton'

const sections = [
  {
    href: '/recipes',
    symbol: '↗',
    eyebrow: 'НАЙТИ ИДЕЮ',
    title: 'Каталог рецептов',
    description: 'Подберите блюдо по вкусу и ингредиентам.',
  },
  {
    href: '/menu',
    symbol: '▦',
    eyebrow: 'СПЛАНИРОВАТЬ',
    title: 'Меню на неделю',
    description: 'Распределите завтраки, обеды и ужины.',
  },
  {
    href: '/shopping',
    symbol: '✓',
    eyebrow: 'ПОДГОТОВИТЬСЯ',
    title: 'Список покупок',
    description: 'Соберите продукты для запланированных блюд.',
  },
]

export default async function Home() {
  const userId = await getUserId()
  const user = userId
    ? await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    })
    : null

  const displayName = user?.name?.trim() || user?.email || null

  return (
    <main className="page">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-12 flex flex-wrap items-center justify-between gap-4 sm:mb-16">
          <Link href="/" className="flex items-center gap-3 rounded-xl" aria-label="Recipe Plan — главная">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-(--color-primary) text-xl text-white shadow-sm">
              ✳
            </span>
            <span>
              <span className="block text-lg font-bold leading-tight tracking-tight">Recipe Plan</span>
              <span className="block text-xs text-muted">Еда, планы, порядок</span>
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {displayName ? (
              <>
                <span className="max-w-48 truncate px-2 text-sm text-secondary sm:max-w-64">
                  Привет, <span className="font-semibold text-(--text-primary)">{displayName}</span>
                </span>
                <Link href="/my-recipes" className="btn btn-outline">Мои рецепты</Link>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-outline">Войти</Link>
                <Link href="/register" className="btn btn-primary">Создать аккаунт</Link>
              </>
            )}
          </div>
        </header>

        <section className="mb-12 grid items-center gap-8 rounded-[1.75rem] border border-(--border) bg-white p-6 shadow-sm sm:mb-16 sm:gap-10 sm:p-10 md:grid-cols-[1.2fr_0.8fr] md:p-14">
          <div className="max-w-2xl">
            <span className="badge mb-5">Планирование без суеты</span>
            <h1 className="mb-5 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
              Хорошая еда начинается с <span className="text-(--color-primary)">простого плана.</span>
            </h1>
            <p className="mb-7 max-w-xl text-base leading-relaxed text-secondary sm:text-lg">
              Собирайте любимые рецепты, продумывайте меню на неделю и покупайте только то, что действительно нужно.
            </p>
            <div className="flex flex-col gap-3 min-[420px]:flex-row">
              <Link href="/recipes" className="btn btn-primary min-h-12 px-5">
                Найти рецепт <span aria-hidden="true">→</span>
              </Link>
              <Link href="/menu" className="btn btn-outline min-h-12 px-5">
                Открыть план меню
              </Link>
            </div>
          </div>

          <div className="relative mx-auto grid w-full max-w-sm grid-cols-2 gap-3" aria-hidden="true">
            <div className="flex min-h-36 flex-col justify-between rounded-2xl bg-[#e7f0e5] p-4 sm:min-h-44 sm:p-5">
              <span className="text-3xl">🥬</span>
              <div>
                <p className="font-semibold text-[#294b31]">Свежие идеи</p>
                <p className="mt-1 text-xs text-[#526b56]">Вдохновение на каждый день</p>
              </div>
            </div>
            <div className="mt-7 flex min-h-36 flex-col justify-between rounded-2xl bg-[#f5eddd] p-4 sm:min-h-44 sm:p-5">
              <span className="text-3xl">🗓️</span>
              <div>
                <p className="font-semibold text-[#69512c]">План на неделю</p>
                <p className="mt-1 text-xs text-[#69512c]">Всё на своих местах</p>
              </div>
            </div>
            <div className="col-span-2 flex items-center gap-4 rounded-2xl border border-(--border) bg-[#f8faf7] p-4 sm:p-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">✓</span>
              <div>
                <p className="font-semibold">Меньше лишних покупок</p>
                <p className="mt-1 text-sm text-secondary">Список продуктов формируется из вашего меню.</p>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="start-heading">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-(--color-primary)">Ваш следующий шаг</p>
              <h2 id="start-heading" className="text-2xl font-bold sm:text-3xl">Всё для вашей кухни</h2>
            </div>
            <p className="max-w-sm text-sm text-secondary">Три простых инструмента — от первой идеи до готового списка покупок.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((section, index) => (
              <Link
                key={section.href}
                href={section.href}
                className="card group flex min-h-52 flex-col items-start p-5 sm:p-6"
                style={{ animation: 'soft-rise 420ms ease both', animationDelay: `${index * 70}ms` }}
              >
                <span className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] text-xl font-semibold text-(--color-primary) transition-transform duration-200 group-hover:scale-105">
                  {section.symbol}
                </span>
                <span className="mb-2 text-[0.68rem] font-bold tracking-[0.14em] text-muted">{section.eyebrow}</span>
                <span className="text-xl font-bold">{section.title}</span>
                <span className="mt-2 text-sm leading-relaxed text-secondary">{section.description}</span>
                <span className="mt-auto pt-5 text-sm font-semibold text-(--color-primary)">Открыть раздел <span aria-hidden="true">→</span></span>
              </Link>
            ))}
          </div>
        </section>

        <footer className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-(--border) py-6 text-sm text-muted">
          <span>Recipe Plan · Планируйте с удовольствием</span>
          {!userId && <Link href="/admin/login" className="link">Для модераторов</Link>}
        </footer>
      </div>
    </main>
  )
}
