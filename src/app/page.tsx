import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Recipe Plan
        </h1>
        <p className="text-lg text-gray-600 mb-10">
          Сервис шеринга рецептов с планировщиком меню
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/recipes"
            className="block p-6 bg-white rounded-xl shadow hover:shadow-md transition text-left"
          >
            <h2 className="text-xl font-semibold text-gray-800">Каталог рецептов</h2>
            <p className="text-gray-500 mt-1">Поиск и фильтры</p>
          </Link>

          <Link
            href="/menu"
            className="block p-6 bg-white rounded-xl shadow hover:shadow-md transition text-left"
          >
            <h2 className="text-xl font-semibold text-gray-800">Меню на неделю</h2>
            <p className="text-gray-500 mt-1">Планировщик (скоро)</p>
          </Link>

          <Link
            href="/shopping"
            className="block p-6 bg-white rounded-xl shadow hover:shadow-md transition text-left"
          >
            <h2 className="text-xl font-semibold text-gray-800">Список покупок</h2>
            <p className="text-gray-500 mt-1">Автоматический (скоро)</p>
          </Link>

          <Link
            href="/admin/login"
            className="block p-6 bg-white rounded-xl shadow hover:shadow-md transition text-left"
          >
            <h2 className="text-xl font-semibold text-gray-800">Админка</h2>
            <p className="text-gray-500 mt-1">Управление рецептами</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
