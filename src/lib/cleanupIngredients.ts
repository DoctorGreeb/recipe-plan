import { prisma } from '@/lib/prisma'

/** Удаляет ингредиенты без рецептов и без позиций в списках покупок */
export async function deleteOrphanIngredients() {
  const result = await prisma.ingredient.deleteMany({
    where: {
      recipes: { none: {} },
      shoppingItems: { none: {} },
    },
  })
  return result.count
}