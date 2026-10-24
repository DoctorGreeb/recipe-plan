import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Очищаем старые данные (на всякий случай)
  await prisma.recipeIngredient.deleteMany()
  await prisma.menuItem.deleteMany()
  await prisma.shoppingItem.deleteMany()
  await prisma.recipe.deleteMany()
  await prisma.ingredient.deleteMany()

  // Ингредиенты
  const flour = await prisma.ingredient.create({ data: { name: 'Мука', unit: 'г' } })
  const milk = await prisma.ingredient.create({ data: { name: 'Молоко', unit: 'мл' } })
  const egg = await prisma.ingredient.create({ data: { name: 'Яйцо', unit: 'шт' } })
  const sugar = await prisma.ingredient.create({ data: { name: 'Сахар', unit: 'г' } })
  const chicken = await prisma.ingredient.create({ data: { name: 'Курица', unit: 'г' } })
  const rice = await prisma.ingredient.create({ data: { name: 'Рис', unit: 'г' } })
  const tomato = await prisma.ingredient.create({ data: { name: 'Помидор', unit: 'шт' } })
  const onion = await prisma.ingredient.create({ data: { name: 'Лук', unit: 'шт' } })
  const oil = await prisma.ingredient.create({ data: { name: 'Масло растительное', unit: 'мл' } })

  // Рецепт 1: Блины
  const pancakes = await prisma.recipe.create({
    data: {
      title: 'Блины',
      description: 'Классические тонкие блины',
      instructions: '1. Смешать муку, молоко и яйца\n2. Добавить сахар\n3. Жарить на сковороде',
      calories: 250,
      category: 'завтрак',
      ingredients: {
        create: [
          { ingredientId: flour.id, amount: 200 },
          { ingredientId: milk.id, amount: 500 },
          { ingredientId: egg.id, amount: 2 },
          { ingredientId: sugar.id, amount: 30 },
        ],
      },
    },
  })

  // Рецепт 2: Курица с рисом
  const chickenRice = await prisma.recipe.create({
    data: {
      title: 'Курица с рисом',
      description: 'Простое и сытное блюдо',
      instructions: '1. Обжарить курицу\n2. Добавить лук и помидоры\n3. Всыпать рис и тушить',
      calories: 420,
      category: 'обед',
      ingredients: {
        create: [
          { ingredientId: chicken.id, amount: 400 },
          { ingredientId: rice.id, amount: 200 },
          { ingredientId: tomato.id, amount: 2 },
          { ingredientId: onion.id, amount: 1 },
          { ingredientId: oil.id, amount: 30 },
        ],
      },
    },
  })

  // Рецепт 3: Омлет
  await prisma.recipe.create({
    data: {
      title: 'Омлет',
      description: 'Пышный омлет',
      instructions: '1. Взбить яйца с молоком\n2. Вылить на сковороду\n3. Жарить под крышкой',
      calories: 180,
      category: 'завтрак',
      ingredients: {
        create: [
          { ingredientId: egg.id, amount: 3 },
          { ingredientId: milk.id, amount: 50 },
          { ingredientId: oil.id, amount: 10 },
        ],
      },
    },
  })

  console.log('Seed выполнен успешно!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })