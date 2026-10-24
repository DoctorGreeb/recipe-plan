'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка регистрации')
      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page flex items-center justify-center">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Регистрация</h1>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <input
          type="text"
          placeholder="Имя (необязательно)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input w-full mb-3"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input w-full mb-3"
          required
        />
        <input
          type="password"
          placeholder="Пароль (мин. 6 символов)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input w-full mb-4"
          required
          minLength={6}
        />
        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>

        <p className="text-center text-sm text-muted mt-4">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="link">
            Войти
          </Link>
        </p>
        <p className="text-center mt-2">
          <Link href="/" className="link text-sm">
            ← На главную
          </Link>
        </p>
      </form>
    </div>
  )
}