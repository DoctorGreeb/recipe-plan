import { redirect } from 'next/navigation'
import { checkAuth } from '@/lib/auth'
import AdminClient from './AdminClient'

export default async function AdminPage() {
  const isAuth = await checkAuth()

  if (!isAuth) {
    redirect('/admin/login')
  }

  return <AdminClient />
}