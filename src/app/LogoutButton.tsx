'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.refresh()
  }

  return (
    <button type="button" onClick={handleLogout} className="btn btn-outline text-sm">
      Выйти
    </button>
  )
}