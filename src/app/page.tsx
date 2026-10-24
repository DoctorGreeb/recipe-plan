import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/userAuth'
import LogoutButton from './LogoutButton'

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
    <div className="page flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
          {displayName ? (
            <>
              <p className="text-secondary">
                Приветствую, <span className="font-medium text-[var(--text-primary)]">{displayName}</span>
              </p>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="link text-sm">
                Войти
              </Link>
              <Link href="/register" className="link text-sm">
                Регистрация
              </Link>
            </>
          )}
        </div>

        <h1 className="text-4xl font-bold mb-4">Recipe Plan</h1>
        <p className="text-lg text-secondary mb-10">
          Сервис шеринга рецептов с планировщиком меню
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/recipes" className="card block text-left hover:shadow-md transition">
            <h2 className="text-xl font-semibold">Каталог рецептов</h2>
            <p className="text-muted mt-1">Поиск и фильтры</p>
          </Link>

          <Link href="/menu" className="card block text-left hover:shadow-md transition">
            <h2 className="text-xl font-semibold">Меню на неделю</h2>
            <p className="text-muted mt-1">Планировщик</p>
          </Link>

          <Link href="/shopping" className="card block text-left hover:shadow-md transition">
            <h2 className="text-xl font-semibold">Список покупок</h2>
            <p className="text-muted mt-1">По меню недели</p>
          </Link>

          {userId ? (
            <Link
              href="/my-recipes"
              className="card block text-left hover:shadow-md transition"
            >
              <h2 className="text-xl font-semibold">Мои рецепты</h2>
              <p className="text-muted mt-1">
                Добавить свой, редактировать, поделиться
              </p>
            </Link>
          ) : (
            <Link href="/admin/login" className="card block text-left hover:shadow-md transition">
              <h2 className="text-xl font-semibold">Для модераторов</h2>
              <p className="text-muted mt-1">Управление рецептами</p>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}