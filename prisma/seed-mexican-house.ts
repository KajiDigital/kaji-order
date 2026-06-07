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

const DRINK_CHOICE: ModifierGroupDef = {
  name: 'Choice of drink',
  required: true,
  max_select: 1,
  modifiers: [
    { name: 'Coke', price_delta_pence: 0 },
    { name: 'Diet Coke', price_delta_pence: 0 },
    { name: 'Sprite', price_delta_pence: 0 },
    { name: 'Fanta', price_delta_pence: 0 },
  ],
}

const FILLING_CHOICE: ModifierGroupDef = {
  name: 'Filling',
  required: true,
  max_select: 1,
  modifiers: [
    { name: 'Chilli Beef', price_delta_pence: 0 },
    { name: 'Spicy Chicken', price_delta_pence: 0 },
    { name: 'Spicy Vegetable', price_delta_pence: 0 },
  ],
}

const MEAT_CHOICE_SKEWER: ModifierGroupDef = {
  name: 'Meat choice',
  required: true,
  max_select: 1,
  modifiers: [
    { name: 'Chicken', price_delta_pence: 0 },
    { name: 'Lamb', price_delta_pence: 0 },
  ],
}

const MEAT_CHOICE_FAJITAS: ModifierGroupDef = {
  name: 'Meat choice',
  required: true,
  max_select: 1,
  modifiers: [
    { name: 'Chicken', price_delta_pence: 0 },
    { name: 'Lamb', price_delta_pence: 200 },
    { name: 'Prawn', price_delta_pence: 200 },
    { name: 'Vegetable', price_delta_pence: -200 },
  ],
}

const MOMO_TYPE: ModifierGroupDef = {
  name: 'Momo type',
  required: true,
  max_select: 1,
  modifiers: [
    { name: 'Lamb', price_delta_pence: 0 },
    { name: 'Chicken', price_delta_pence: 0 },
  ],
}

const categories: CategoryDef[] = [
  {
    name: 'Most Popular',
    sort_order: 0,
    color: '#ef4444',
    items: [
      {
        name: 'Halloumi Fingers',
        price_pence: 585,
        description:
          'Grilled halloumi finger with spicy red pepper chutney & house green crispy salad',
      },
      {
        name: 'Taquitos',
        price_pence: 585,
        description:
          'Covered in fresh spices, herbs & wrapped in a flour tortilla; Deep fried & served with house green crispy salad & salsa, accompanied with BBQ sauce for dipping',
      },
      {
        name: 'Crispy Potato Skin',
        price_pence: 594,
        description: 'Served with topped sour cream',
      },
      {
        name: 'Mexican House Two Course Meal',
        price_pence: 1495,
        description:
          'Starter: garlic bread, halloumi fingers, jalapenos rellenos, albondigas or Mexican chipotle dippers; Mains: chimichanga, Mexican house burritos or trio of tacos',
      },
      {
        name: 'Quesadillas Delight',
        price_pence: 536,
        description: 'Delicious toasted tortilla with cheese and fillings',
      },
      {
        name: 'Mexican House Signature Fajita Chicken',
        price_pence: 1215,
        description:
          'Hot sizzling strips with mixed capsicum, onion & mushroom with warm tortillas served with crispy salad, guacamole, sour cream & salsa',
      },
      {
        name: 'Extra Special Nachos',
        price_pence: 675,
        description: 'With chilli beef, spicy chicken',
      },
      {
        name: 'Chimichanga Meal',
        price_pence: 986,
        description:
          'A fried, rolled flour tortilla with your choice of filling, sauteed peppers & onions, cheese, chipotle chilli sauce & sour cream, finished with spicy Mexican rice, homemade beans & crispy salad',
      },
      {
        name: 'Enchilada Meal',
        price_pence: 986,
        description:
          'Two corn tortilla rolled with chilli beef, spicy chicken or spicy vegetable garnished with cheese & special sauce also topped with sour cream, served with Mexican rice & herbs',
      },
      {
        name: 'Mexican House Burrito',
        price_pence: 986,
        description:
          'Combined with homemade beans, spicy Mexican rice, salsa, chipotle sauce, guacamole & sour cream all wrapped in a soft white flour tortilla served with spicy wedges or chips',
      },
    ],
  },
  {
    name: 'Meal Deals & Burger Meals',
    sort_order: 1,
    color: '#f97316',
    items: [
      {
        name: 'Regular Chicken Fillet Burger Meal',
        price_pence: 850,
        description: 'Chicken breast fillet with lettuce & mayo, chips and can of drinks',
      },
      {
        name: 'Nugget Bucket',
        price_pence: 850,
        description: 'Bucket of Nuggets (10 pieces), Chips and drinks',
      },
      {
        name: 'Wings Box',
        price_pence: 950,
        description: '10 pieces of spicy chicken, fries and can drink',
      },
      {
        name: 'Chicken Mexiyani',
        price_pence: 1095,
        description:
          'Patented by Mexican house: Breast of chicken in Mexican sauce, served on the bed of rice, topped with melted cheese, Nachos, salsa, sour cream, guacamole, Jalapeno, with salad and can of drink or ice cream',
        modifierGroups: [DRINK_CHOICE],
      },
      {
        name: 'Beef Mexiyani',
        price_pence: 1095,
        description:
          'Chilly Beef cooked in Mexican style, served on the bed of rice, topped with melted cheese, Nachos, salsa, sour cream, guacamole, Jalapeno, with salad and can of drink or ice cream',
        modifierGroups: [DRINK_CHOICE],
      },
      {
        name: 'Hot & Spicy Momo With Can Drink',
        price_pence: 1000,
        description: '10 Pcs of Momo with spicy dip & a can of Coke',
        modifierGroups: [MOMO_TYPE],
      },
      {
        name: 'Family Pack Meal',
        price_pence: 2595,
        description:
          'Chicken nuggets & chips, halloumi fingers, beef tacos, salads, bottle of Coke, Mexican house churros',
      },
    ],
  },
  {
    name: 'Starters',
    sort_order: 2,
    color: '#eab308',
    items: [
      { name: 'Garlic Bread', price_pence: 405, description: 'Plain garlic bread' },
      {
        name: 'Garlic Bread with Cheese',
        price_pence: 495,
        description: 'Garlic bread topped with melted cheese',
      },
      {
        name: 'Quesadillas Delight',
        price_pence: 536,
        description: 'Toasted flour tortilla with cheese and fillings',
      },
      {
        name: 'Taquitos',
        price_pence: 585,
        description: 'Deep fried flour tortilla with fresh spices, served with salad & salsa',
      },
      {
        name: 'Crispy Potato Skin',
        price_pence: 594,
        description: 'Served with topped sour cream',
      },
      {
        name: 'Jalapenos Rellenos',
        price_pence: 585,
        description:
          'Hot jalapenos stuffed with spicy cream cheese, topped with sour cream & garnished with house green crispy salad & salsa',
      },
      {
        name: 'Chicken Wings',
        price_pence: 585,
        description:
          'Tossed BBQ sauce & served with a pot of sour cream & house green crispy salad',
      },
      {
        name: 'Albondigas',
        price_pence: 594,
        description:
          'Homemade meatballs covered in a rich tomato, mixed herb sauce & Parmesan shavings served with garlic bread',
      },
      {
        name: 'Mexican Chipotle Dippers',
        price_pence: 585,
        description:
          'Spicy chipotle stripped chicken covered in crunchy breadcrumbs, deep fried, served with spicy salsa & BBQ dip',
      },
      {
        name: 'Crispy Calamari',
        price_pence: 585,
        description:
          'Seasoned calamari, lightly breaded & fried, served with chipotle mayo & house green crispy salad',
      },
      {
        name: 'Veg Spring Roll',
        price_pence: 536,
        description: '4 Pcs of spring roll with sweet or hot chilli sauce',
      },
      {
        name: 'Chilli Mushroom',
        price_pence: 536,
        description: 'Button mushrooms cooked in tomato, chilli and garlic sauce',
      },
      {
        name: 'Chilli Prawn Skewer',
        price_pence: 716,
        description:
          'Sauteed prawns skewer, served with tartar sauce & house green crispy salad',
      },
      {
        name: 'Mexican House Shared Platter',
        price_pence: 1976,
        description:
          'A selection of appetizers including stuffed jalapenos, taquitos beef, Mexican chipotle dippers, crispy calamari',
      },
    ],
  },
  {
    name: 'Mains',
    sort_order: 3,
    color: '#22c55e',
    items: [
      {
        name: 'Trio of Tacos',
        price_pence: 986,
        description:
          'Three crispy shell tacos filled with authentic chilli topped with salad mixture, cheese & sour cream',
        modifierGroups: [FILLING_CHOICE],
      },
      {
        name: 'Authentic Mexican House Chilli',
        price_pence: 986,
        description:
          'Served on the crispy edible tortilla bowl, topped with cheese, pico de gallo, sour cream on a bed of spicy Mexican rice',
      },
      {
        name: 'Pan Fry Sea Bass Fillet Meal',
        price_pence: 1256,
        description:
          'Pan fried sea bass fillet with herbs & lemon served with homemade beans, spicy Mexican rice & house green crispy salads',
      },
      {
        name: 'Skewer',
        price_pence: 1256,
        description:
          'Marinated tender skewers, charcoal grilled & served with house green crispy salad, spicy Mexican rice, mint yoghurt dip',
        modifierGroups: [MEAT_CHOICE_SKEWER],
      },
      {
        name: 'Chimichanga',
        price_pence: 986,
        description:
          'A fried rolled flour tortilla with your choice of filling, sauteed peppers & onions, cheese, chipotle chilli sauce & sour cream',
        modifierGroups: [FILLING_CHOICE],
      },
      {
        name: 'Enchilada',
        price_pence: 986,
        description:
          'Two corn tortilla rolled with filling, garnished with cheese & special sauce, topped with sour cream, served with Mexican rice',
        modifierGroups: [FILLING_CHOICE],
      },
      {
        name: 'Mexican House Burrito',
        price_pence: 986,
        description:
          'Combined with homemade beans, spicy Mexican rice, salsa, chipotle sauce, guacamole & sour cream in a soft flour tortilla',
        modifierGroups: [FILLING_CHOICE],
      },
      {
        name: 'Fajitas',
        price_pence: 1215,
        description:
          'Hot sizzling strips with mixed capsicum, onion & mushroom, warm tortillas, crispy salad, guacamole, sour cream & salsa',
        modifierGroups: [MEAT_CHOICE_FAJITAS],
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
    `Seeded ${categories.length} categories and ${itemCount} items for Mexican House`
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
