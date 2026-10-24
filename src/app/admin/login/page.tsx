'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
    })

    if (res.ok) {
      router.push('/admin')
      router.refresh()
    } else {
      setError('Неверный логин или пароль')
    }
  }

  return (
    <div className="page flex items-center justify-center">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Вход в админку</h1>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <input
          type="text"
          placeholder="Логин"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          className="input mb-3"
          required
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input mb-4"
          required
        />
        <button type="submit" className="btn btn-primary w-full">
          Войти
        </button>
      </form>
    </div>
  )
}
