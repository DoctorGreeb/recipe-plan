import { redirect } from 'next/navigation'
import { getUserId } from '@/lib/userAuth'
import MyRecipesClient from './MyRecipesClient'

export default async function MyRecipesPage() {
  const userId = await getUserId()
  if (!userId) {
    redirect('/login')
  }

  return <MyRecipesClient />
}