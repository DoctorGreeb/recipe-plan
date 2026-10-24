import Link from 'next/link'

export default function Home() {
  return (
    <div className="page flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full text-center">
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
            <p className="text-muted mt-1">Планировщик (скоро)</p>
          </Link>

          <Link href="/shopping" className="card block text-left hover:shadow-md transition">
            <h2 className="text-xl font-semibold">Список покупок</h2>
            <p className="text-muted mt-1">Автоматический (скоро)</p>
          </Link>

          <Link href="/admin/login" className="card block text-left hover:shadow-md transition">
            <h2 className="text-xl font-semibold">Админка</h2>
            <p className="text-muted mt-1">Управление рецептами</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
