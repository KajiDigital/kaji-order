/**
 * One-time migration: ModifierGroup/Modifier → OptionGroup/Option or ComboGroup/ComboOption.
 * Run: npx ts-node --project prisma/tsconfig.json prisma/scripts/migrate-modifiers-to-options.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function inferGroupType(required: boolean, minSelect: number, maxSelect: number): string {
  if (maxSelect === 1) return 'SINGLE'
  if (!required && minSelect === 0) return 'OPTIONAL'
  return 'MULTIPLE'
}

async function main() {
  const existing = await prisma.optionGroup.count()
  if (existing > 0) {
    console.log('Option groups already exist — skipping data migration.')
    return
  }

  const modifierGroups = await prisma.modifierGroup.findMany({
    include: { modifiers: { orderBy: { sort_order: 'asc' } }, menu_item: true },
    orderBy: { sort_order: 'asc' },
  })

  let optionGroups = 0
  let comboGroups = 0

  for (const mg of modifierGroups) {
    const isBundle = mg.menu_item.is_bundle

    if (isBundle) {
      const restaurantItems = await prisma.menuItem.findMany({
        where: { restaurant_id: mg.restaurant_id },
        select: { id: true, name: true },
      })
      const nameToId = new Map(restaurantItems.map((i) => [i.name.toLowerCase(), i.id]))

      const matchedOptions = mg.modifiers
        .map((mod, i) => ({ mod, i, menuItemId: nameToId.get(mod.name.toLowerCase()) }))
        .filter((o) => o.menuItemId)

      if (matchedOptions.length === mg.modifiers.length && matchedOptions.length > 0) {
        await prisma.comboGroup.create({
          data: {
            item_id: mg.menu_item_id,
            name: mg.name,
            required: mg.required,
            min_items: mg.min_select || (mg.required ? 1 : 0),
            max_items: mg.max_select,
            source_type: 'ITEMS',
            sort_order: mg.sort_order,
            combo_options: {
              create: matchedOptions.map(({ mod, i, menuItemId }) => ({
                menu_item_id: menuItemId!,
                sort_order: i,
              })),
            },
          },
        })
        comboGroups++
      } else {
        await prisma.optionGroup.create({
          data: {
            item_id: mg.menu_item_id,
            name: mg.name,
            group_type: 'SINGLE',
            required: mg.required,
            min_selections: mg.min_select,
            max_selections: mg.max_select,
            sort_order: mg.sort_order,
            options: {
              create: mg.modifiers.map((m, mi) => ({
                name: m.name,
                price_delta: m.price_delta_pence,
                is_default: m.is_default,
                sort_order: mi,
              })),
            },
          },
        })
        optionGroups++
      }
    } else {
      await prisma.optionGroup.create({
        data: {
          item_id: mg.menu_item_id,
          name: mg.name,
          group_type: inferGroupType(mg.required, mg.min_select, mg.max_select),
          required: mg.required,
          min_selections: mg.min_select,
          max_selections: mg.max_select,
          sort_order: mg.sort_order,
          options: {
            create: mg.modifiers.map((mod, i) => ({
              name: mod.name,
              price_delta: mod.price_delta_pence,
              is_default: mod.is_default,
              sort_order: i,
            })),
          },
        },
      })
      optionGroups++
    }
  }

  await prisma.$executeRaw`
    UPDATE online_order_items
    SET total_price = price_pence
    WHERE total_price = 0
  `

  await prisma.menuItem.updateMany({
    where: { is_bundle: true },
    data: { pricing_type: 'BUNDLE' },
  })

  console.log(
    `Migrated ${optionGroups} option groups, ${comboGroups} combo groups from ${modifierGroups.length} modifier groups.`
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
