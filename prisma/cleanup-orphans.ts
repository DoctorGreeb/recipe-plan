import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const result = await prisma.ingredient.deleteMany({
    where: {
      recipes: { none: {} },
      shoppingItems: { none: {} },
    },
  })
  console.log(`Удалено ингредиентов: ${result.count}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())