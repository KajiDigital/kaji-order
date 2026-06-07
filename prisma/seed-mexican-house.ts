import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type ModifierDef = { name: string; price_delta_pence: number }

type ModifierGroupDef = {
  name: string
  required: boolean
  max_select: number
  modifiers: ModifierDef[]
}

type ItemDef = {
  name: string
  price_pence: number
  description: string
  modifierGroups?: ModifierGroupDef[]
}

type CategoryDef = {
  name: string
  sort_order: number
  color: string
  items: ItemDef[]
}

const WING_SAUCE: ModifierGroupDef = {
  name: 'Choice of sauce',
  required: true,
  max_select: 1,
  modifiers: [
    { name: 'BBQ', price_delta_pence: 0 },
    { name: 'Buffalo', price_delta_pence: 0 },
    { name: 'Lemon & Herb', price_delta_pence: 0 },
  ],
}

const CHICKEN_STYLE: ModifierGroupDef = {
  name: 'Chicken style',
  required: true,
  max_select: 1,
  modifiers: [
    { name: 'Grilled', price_delta_pence: 0 },
    { name: 'Crispy fried', price_delta_pence: 0 },
  ],
}

const CHIMICHANGA_FILLING: ModifierGroupDef = {
  name: 'Filling',
  required: true,
  max_select: 1,
  modifiers: [
    { name: 'Chicken', price_delta_pence: 0 },
    { name: 'Beef', price_delta_pence: 0 },
  ],
}

const DIP_CHOICE: ModifierGroupDef = {
  name: 'Dip choice',
  required: true,
  max_select: 1,
  modifiers: [
    { name: 'Salsa', price_delta_pence: 0 },
    { name: 'Sour Cream', price_delta_pence: 0 },
    { name: 'Guacamole', price_delta_pence: 0 },
    { name: 'Garlic Mayo', price_delta_pence: 0 },
    { name: 'BBQ', price_delta_pence: 0 },
    { name: 'Buffalo', price_delta_pence: 0 },
  ],
}

const SOFT_DRINK: ModifierGroupDef = {
  name: 'Drink choice',
  required: true,
  max_select: 1,
  modifiers: [
    { name: 'Coke', price_delta_pence: 0 },
    { name: 'Diet Coke', price_delta_pence: 0 },
    { name: 'Fanta Orange', price_delta_pence: 0 },
    { name: 'Sprite', price_delta_pence: 0 },
  ],
}

const JARRITOS_FLAVOUR: ModifierGroupDef = {
  name: 'Flavour',
  required: true,
  max_select: 1,
  modifiers: [
    { name: 'Lime', price_delta_pence: 0 },
    { name: 'Mango', price_delta_pence: 0 },
    { name: 'Pineapple', price_delta_pence: 0 },
    { name: 'Guava', price_delta_pence: 0 },
  ],
}

const CHURROS_SAUCE: ModifierGroupDef = {
  name: 'Dipping sauce',
  required: true,
  max_select: 1,
  modifiers: [
    { name: 'Chocolate', price_delta_pence: 0 },
    { name: 'Caramel', price_delta_pence: 0 },
  ],
}

const categories: CategoryDef[] = [
  {
    name: 'Starters',
    sort_order: 0,
    color: '#ef4444',
    items: [
      {
        name: 'Chicken Wings (6pcs)',
        price_pence: 595,
        description:
          'Succulent chicken wings tossed in your choice of sauce: BBQ, Buffalo, or Lemon & Herb.',
        modifierGroups: [WING_SAUCE],
      },
      {
        name: 'Chicken Wings (10pcs)',
        price_pence: 895,
        description: 'Succulent chicken wings tossed in your choice of sauce.',
        modifierGroups: [WING_SAUCE],
      },
      {
        name: 'Mozzarella Sticks (5pcs)',
        price_pence: 495,
        description: 'Gooey mozzarella sticks served with a tangy salsa dip.',
      },
      {
        name: 'Jalapeno Poppers (5pcs)',
        price_pence: 545,
        description: 'Cream cheese filled jalapenos in a crunchy breadcrumb coating.',
      },
      {
        name: 'Halloumi Fries',
        price_pence: 595,
        description: 'Crispy halloumi fries served with a sweet chilli dipping sauce.',
      },
      { name: 'Garlic Bread', price_pence: 395, description: 'Plain garlic bread.' },
      {
        name: 'Garlic Bread with Cheese',
        price_pence: 495,
        description: 'Garlic bread topped with melted cheese.',
      },
      {
        name: 'Loaded Fries - Chilli Beef',
        price_pence: 795,
        description: 'Fries topped with our homemade chilli beef, melted cheese and jalapenos.',
      },
      {
        name: 'Loaded Fries - Chicken',
        price_pence: 745,
        description: 'Fries topped with seasoned chicken, melted cheese and peppers.',
      },
    ],
  },
  {
    name: 'Nachos',
    sort_order: 1,
    color: '#f97316',
    items: [
      {
        name: 'Classic Nachos',
        price_pence: 645,
        description:
          'Crunchy tortilla chips topped with melted cheese, salsa, sour cream, guacamole and jalapenos.',
      },
      {
        name: 'Chilli Beef Nachos',
        price_pence: 845,
        description: 'Our classic nachos topped with homemade chilli beef.',
      },
      {
        name: 'Chicken Nachos',
        price_pence: 795,
        description: 'Our classic nachos topped with seasoned grilled chicken.',
      },
    ],
  },
  {
    name: 'Burritos',
    sort_order: 2,
    color: '#eab308',
    items: [
      {
        name: 'Chicken Burrito',
        price_pence: 945,
        description:
          'Wrapped in a large flour tortilla with Mexican rice, black beans, cheese, salsa and sour cream.',
      },
      {
        name: 'Beef Burrito',
        price_pence: 1045,
        description:
          'Wrapped in a large flour tortilla with Mexican rice, black beans, cheese, salsa and sour cream.',
      },
      {
        name: 'Veggie Burrito',
        price_pence: 845,
        description:
          'Wrapped in a large flour tortilla with Mexican rice, black beans, cheese, salsa and sour cream.',
      },
      {
        name: 'Pulled Pork Burrito',
        price_pence: 995,
        description:
          'Wrapped in a large flour tortilla with Mexican rice, black beans, cheese, salsa and sour cream.',
      },
    ],
  },
  {
    name: 'Tacos',
    sort_order: 3,
    color: '#22c55e',
    items: [
      {
        name: 'Chicken Tacos',
        price_pence: 945,
        description: 'Three soft corn tortillas served with fresh salsa and a wedge of lime.',
      },
      {
        name: 'Beef Tacos',
        price_pence: 1045,
        description: 'Three soft corn tortillas served with fresh salsa and a wedge of lime.',
      },
      {
        name: 'Veggie Tacos',
        price_pence: 845,
        description: 'Three soft corn tortillas served with fresh salsa and a wedge of lime.',
      },
      {
        name: 'Pulled Pork Tacos',
        price_pence: 995,
        description: 'Three soft corn tortillas served with fresh salsa and a wedge of lime.',
      },
    ],
  },
  {
    name: 'Quesadillas',
    sort_order: 4,
    color: '#14b8a6',
    items: [
      {
        name: 'Chicken Quesadilla',
        price_pence: 895,
        description:
          'A large flour tortilla filled with cheese and chicken, toasted until golden.',
      },
      {
        name: 'Beef Quesadilla',
        price_pence: 995,
        description:
          'A large flour tortilla filled with cheese and beef, toasted until golden.',
      },
      {
        name: 'Veggie Quesadilla',
        price_pence: 795,
        description:
          'A large flour tortilla filled with cheese and vegetables, toasted until golden.',
      },
      {
        name: 'Cheese Quesadilla',
        price_pence: 695,
        description: 'A large flour tortilla filled with cheese, toasted until golden.',
      },
    ],
  },
  {
    name: 'Enchiladas',
    sort_order: 5,
    color: '#8b5cf6',
    items: [
      {
        name: 'Chicken Enchiladas',
        price_pence: 1045,
        description:
          'Two corn tortillas rolled with chicken, topped with enchilada sauce and melted cheese, then baked.',
      },
      {
        name: 'Beef Enchiladas',
        price_pence: 1145,
        description:
          'Two corn tortillas rolled with beef, topped with enchilada sauce and melted cheese, then baked.',
      },
      {
        name: 'Veggie Enchiladas',
        price_pence: 945,
        description:
          'Two corn tortillas rolled with vegetables, topped with enchilada sauce and melted cheese, then baked.',
      },
    ],
  },
  {
    name: 'Fajitas',
    sort_order: 6,
    color: '#ec4899',
    items: [
      {
        name: 'Chicken Fajitas',
        price_pence: 1295,
        description:
          'Sizzling platter with peppers and onions. Served with 3 flour tortillas, salsa, sour cream and guacamole.',
      },
      {
        name: 'Beef Fajitas',
        price_pence: 1395,
        description:
          'Sizzling platter with peppers and onions. Served with 3 flour tortillas, salsa, sour cream and guacamole.',
      },
      {
        name: 'Veggie Fajitas',
        price_pence: 1095,
        description:
          'Sizzling platter with peppers and onions. Served with 3 flour tortillas, salsa, sour cream and guacamole.',
      },
      {
        name: 'Mixed Fajitas (Chicken & Beef)',
        price_pence: 1495,
        description:
          'Sizzling platter with peppers and onions. Served with 3 flour tortillas, salsa, sour cream and guacamole.',
      },
    ],
  },
  {
    name: 'Burgers',
    sort_order: 7,
    color: '#f43f5e',
    items: [
      {
        name: 'Classic Beef Burger',
        price_pence: 995,
        description:
          'Served in a toasted brioche bun with lettuce, tomato, red onion and a side of fries.',
      },
      {
        name: 'Cheese Burger',
        price_pence: 1095,
        description:
          'Served in a toasted brioche bun with lettuce, tomato, red onion and a side of fries.',
      },
      {
        name: 'Mexican Burger',
        price_pence: 1195,
        description:
          'Topped with homemade chilli beef, cheese and jalapenos. Served with fries.',
      },
      {
        name: 'Chicken Burger',
        price_pence: 995,
        description:
          'Choose between grilled or crispy fried chicken breast. Served with fries.',
        modifierGroups: [CHICKEN_STYLE],
      },
    ],
  },
  {
    name: 'Mains',
    sort_order: 8,
    color: '#6366f1',
    items: [
      {
        name: 'Chilli Con Carne',
        price_pence: 1095,
        description:
          'Our homemade beef chilli served with Mexican rice and crunchy tortilla chips.',
      },
      {
        name: 'Chimichanga',
        price_pence: 1145,
        description:
          'A deep-fried burrito filled with your choice of chicken or beef, topped with salsa and sour cream.',
        modifierGroups: [CHIMICHANGA_FILLING],
      },
      {
        name: 'Mexican Paella',
        price_pence: 1295,
        description:
          'Traditional rice dish with chicken, spicy chorizo, prawns and mixed peppers.',
      },
    ],
  },
  {
    name: 'Sides',
    sort_order: 9,
    color: '#84cc16',
    items: [
      { name: 'Fries', price_pence: 345, description: 'Classic french fries.' },
      { name: 'Cheesy Fries', price_pence: 445, description: 'Fries topped with melted cheese.' },
      {
        name: 'Sweet Potato Fries',
        price_pence: 445,
        description: 'Crispy sweet potato fries.',
      },
      { name: 'Mexican Rice', price_pence: 345, description: 'Spiced Mexican rice.' },
      { name: 'Corn on the Cob', price_pence: 345, description: 'Grilled corn on the cob.' },
      { name: 'Side Salad', price_pence: 345, description: 'Fresh mixed side salad.' },
      {
        name: 'Extra Dips',
        price_pence: 95,
        description: 'Choice of Salsa, Sour Cream, Guacamole, Garlic Mayo, BBQ, or Buffalo.',
        modifierGroups: [DIP_CHOICE],
      },
    ],
  },
  {
    name: 'Kids Menu',
    sort_order: 10,
    color: '#0ea5e9',
    items: [
      {
        name: 'Chicken Nuggets & Fries',
        price_pence: 545,
        description: 'Kids portion of chicken nuggets with fries.',
      },
      {
        name: 'Fish Fingers & Fries',
        price_pence: 545,
        description: 'Kids portion of fish fingers with fries.',
      },
      {
        name: 'Cheese Quesadilla & Fries',
        price_pence: 545,
        description: 'Kids cheese quesadilla served with fries.',
      },
    ],
  },
  {
    name: 'Desserts',
    sort_order: 11,
    color: '#a855f7',
    items: [
      {
        name: 'Churros (4pcs)',
        price_pence: 545,
        description:
          'Mexican doughnuts dusted in cinnamon sugar, served with chocolate or caramel dipping sauce.',
        modifierGroups: [CHURROS_SAUCE],
      },
      {
        name: 'Chocolate Brownie',
        price_pence: 545,
        description: 'Warm chocolate brownie served with a scoop of vanilla ice cream.',
      },
      {
        name: 'Cheesecake',
        price_pence: 545,
        description: "Ask for today's flavour.",
      },
    ],
  },
  {
    name: 'Drinks',
    sort_order: 12,
    color: '#64748b',
    items: [
      {
        name: 'Soft Drinks (330ml Can)',
        price_pence: 150,
        description: 'Coke, Diet Coke, Fanta Orange, Sprite.',
        modifierGroups: [SOFT_DRINK],
      },
      { name: 'Water (500ml)', price_pence: 120, description: 'Still bottled water.' },
      {
        name: 'Jarritos (370ml)',
        price_pence: 295,
        description: 'Authentic Mexican soda. Flavours: Lime, Mango, Pineapple, Guava.',
        modifierGroups: [JARRITOS_FLAVOUR],
      },
    ],
  },
]

async function main() {
  const slug = process.env.RESTAURANT_SLUG ?? 'mexican-house-liverpool'

  const restaurant = await prisma.restaurant.findFirst({
    where: { slug },
  })

  if (!restaurant) {
    console.log(`Restaurant not found (slug: ${slug}) - create it first`)
    process.exit(1)
  }

  console.log(`Seeding menu for ${restaurant.name} (${restaurant.slug})...`)

  await prisma.menuItem.deleteMany({
    where: { category: { restaurant_id: restaurant.id } },
  })
  await prisma.menuCategory.deleteMany({
    where: { restaurant_id: restaurant.id },
  })

  let itemCount = 0

  for (const categoryDef of categories) {
    const category = await prisma.menuCategory.create({
      data: {
        restaurant_id: restaurant.id,
        name: categoryDef.name,
        color: categoryDef.color,
        sort_order: categoryDef.sort_order,
      },
    })

    for (let i = 0; i < categoryDef.items.length; i++) {
      const itemDef = categoryDef.items[i]
      const menuItem = await prisma.menuItem.create({
        data: {
          restaurant_id: restaurant.id,
          category_id: category.id,
          name: itemDef.name,
          description: itemDef.description,
          price_pence: itemDef.price_pence,
          sort_order: i,
        },
      })
      itemCount++

      if (itemDef.modifierGroups) {
        for (let g = 0; g < itemDef.modifierGroups.length; g++) {
          const groupDef = itemDef.modifierGroups[g]
          await prisma.modifierGroup.create({
            data: {
              restaurant_id: restaurant.id,
              menu_item_id: menuItem.id,
              name: groupDef.name,
              required: groupDef.required,
              min_select: groupDef.required ? 1 : 0,
              max_select: groupDef.max_select,
              sort_order: g,
              modifiers: {
                create: groupDef.modifiers.map((mod, m) => ({
                  name: mod.name,
                  price_delta_pence: mod.price_delta_pence,
                  sort_order: m,
                })),
              },
            },
          })
        }
      }
    }
  }

  console.log(
    `Seeded ${categories.length} categories and ${itemCount} items for ${restaurant.name}`
  )

  await prisma.restaurant.update({
    where: { id: restaurant.id },
    data: {
      primary_color: '#c2410c',
      brand_color: '#c2410c',
      banner_url: null,
    },
  })

  console.log('Updated Mexican House branding: primary_color=#c2410c')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
