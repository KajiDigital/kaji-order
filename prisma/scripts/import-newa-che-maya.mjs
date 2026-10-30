/**
 * Import Newa Che Maya menu from newache.co.uk screenshots.
 * Run against production after impersonating:
 *   KAJI_SESSION='...' node prisma/scripts/import-newa-che-maya.mjs
 */
const BASE = process.env.KAJI_ORDER_URL ?? 'https://order.kajipos.co.uk'
const COOKIE = process.env.KAJI_SESSION
if (!COOKIE) {
  console.error('Set KAJI_SESSION to a kaji_order_session cookie value')
  process.exit(1)
}

const pence = (pounds) => Math.round(Number(pounds) * 100)

const MENU = [
  {
    name: 'Newa Che Corner',
    color: '#b45309',
    items: [
      { name: '3 FOR £27 DEAL', price: 27, bundle: true, description: 'Choose any three items for £27' },
      { name: 'Chatpat', price: 9.95, description: 'Newari street food, spicy and tangy with cowpuff, fried noodles, bhuja and chutney' },
      { name: 'Sukuti Chatpate', price: 9.95, description: 'Sukuti (dried meat) mixed with Chatpate' },
      { name: 'Plain Bara (2pcs)', price: 8.95, description: 'Traditional lentil-patty pancake' },
      { name: 'Egg Bara', price: 8.95, description: 'Traditional Newari lentil patty fried and topped with egg' },
      { name: 'Mix Bara (Egg and Chicken)', price: 9.95, description: 'Bara topped with egg and mince chicken' },
      { name: 'Mix Chatamari (Egg and Chicken)', price: 9.95, description: 'Traditional Newari rice crepe topped with egg and mixed meat' },
      { name: 'Pork Ko Kaan', price: 9.95, available: false, description: 'Pork sausage, fried grilled with chutney' },
      { name: 'Pork Ribs', price: 9.95, description: 'Pork ribs seasoned with spices, herbs and chilli flakes' },
      { name: 'Pork Chilli', price: 9.95, description: 'Diced pork stir-fried in homemade sauce with tomatoes and onions' },
      { name: 'Pangra', price: 9.95 },
      { name: 'Bhutani', price: 8.95, description: 'Pan-fried mixed meats seasoned with traditional spices' },
      { name: 'Mataiko Fried Fish (Weekend Only)', price: 9.95, description: 'Fried fish with Newa Che spice' },
      { name: 'Fish Chilli', price: 9.95, description: 'Fried river fish in sauce with tomatoes, onions and spices' },
      { name: 'Chicken Cholia', price: 9.95, description: 'Traditional Newari chicken pieces mixed with spices' },
      { name: 'Chicken Chilli', price: 8.95 },
      { name: 'Chicken Sausages Chilli', price: 8.95, description: 'Chicken sausage tossed in spices, onion and chilli sauce' },
      { name: 'Chicken Lollipop', price: 8.95, description: 'Marinated and deep-fried chicken drumsticks' },
      { name: 'Hot Crispy Chicken Wings', price: 8.95 },
      { name: 'Aloo Chopa (4pcs)', price: 8.95, available: false },
      { name: 'Sandheko Aloo', price: 8.95 },
      { name: 'Aloo Nimki', price: 7.95 },
      { name: 'Mushroom Cholia', price: 8.95, vegetarian: true },
      { name: 'Soyabean Cholia', price: 8.95, vegetarian: true },
      { name: 'Paneer Sekuwa (6pcs)', price: 7.95, vegetarian: true },
      { name: 'Pani Puri (10pcs)', price: 7.95, vegetarian: true },
      { name: 'Samosa Chat', price: 8.95, vegetarian: true },
      { name: 'Chicken Sekuwa', price: 8.95 },
      { name: 'Veg Pakora', price: 7.95, vegetarian: true },
      { name: 'Lamb Chola (4pcs)', price: 9.95 },
      { name: 'Mustang Aloo', price: 8.95, vegetarian: true },
      { name: 'Lhaphing', price: 8.95, available: false },
    ],
  },
  {
    name: 'Newa Che Special',
    color: '#991b1b',
    items: [
      { name: 'Manange Momo (Pork, Weekend only)', price: 9.95 },
      { name: 'Lamb Sekuwa', price: 9.95 },
      { name: 'Buff Sekuwa', price: 10.95 },
      { name: 'Buff Sukuti', price: 9.95 },
      { name: 'Buff Chilli', price: 8.95 },
      { name: 'Buff Momo', price: 9.95 },
      { name: 'Prawn Chilli', price: 8.95 },
      { name: 'Pork Sekuwa', price: 9.95 },
      { name: 'Sai Roti & Aloo (3 pcs)', price: 9.95, available: false, description: 'Please call to check availability before ordering' },
    ],
  },
  {
    name: 'Samay Baji (Khaja Set)',
    color: '#a16207',
    items: [
      {
        name: 'Mutton Khaja Set',
        price: 15.95,
        bundle: true,
        description: 'Bara, Chatamari, Cholia, Bhuja, Aloo Sandheko, Achar, Salad, Mix Achar, Mutton Sekuwa, Bhatmas & Chiura',
      },
      {
        name: 'Chicken Khaja Set',
        price: 13.95,
        bundle: true,
        description: 'Bara, Baji, Chicken Cholia, Bhuja, Aloo Sandheko, Achar, Mix Achar, Chicken Sekuwa, Bhatmas & Chiura',
      },
    ],
  },
  {
    name: 'Momo & Chowmein',
    color: '#b91c1c',
    items: [
      { name: 'Steam Momo', price: 8.95, description: 'Most popular Nepalese dish from Kathmandu' },
      { name: 'Jhol Momo', price: 8.95 },
      { name: 'Chilli Momo', price: 8.95 },
      { name: 'Kothey Momo', price: 8.95 },
      { name: 'Chowmein', price: 8.95, description: 'Nepalese style chowmein' },
      { name: 'Thukpa', price: 8.95 },
      { name: 'Hakka Noodles', price: 8.95, description: 'Nepalese style Hakka noodles' },
    ],
  },
  {
    name: 'Thakali Khana Set',
    color: '#854d0e',
    items: [
      {
        name: 'Non-Veg Set',
        price: 15.95,
        bundle: true,
        description: 'Goat or chicken curry, Tare Ko Dal, Aloo Achar, soup, mix gundruk, yogurt, rice, papad & gulab jamun',
      },
      {
        name: 'Veg Set',
        price: 17.95,
        bundle: true,
        vegetarian: true,
        description: 'Aloo Tare, veg curry with paneer, Mula Achar, soup, jeera rice, papad, mix yoghurt & gulab jamun',
      },
      {
        name: 'Kathmandu Ko Taas Set',
        price: 15.95,
        bundle: true,
        description: 'Lamb or chicken, chiura, Mula Achar & salad',
      },
    ],
  },
  {
    name: 'Chef Special',
    color: '#9a3412',
    items: [
      {
        name: 'Chef Special Platter',
        price: 15.95,
        bundle: true,
        description: 'Mix veg, cholia (chicken or mutton), mix achar, aloo, gundruk, bhatmas & chiura',
      },
      { name: 'Sizzling Chicken', price: 12.95 },
      { name: 'Chinese Chicken Beena', price: 10.95 },
      { name: "Fakhir' Chilli Chicken / Mushroom (Hot)", price: 10.95, spice: 2 },
      { name: 'Hot Thai Chicken (Hot)', price: 10.95, spice: 2 },
    ],
  },
  {
    name: 'Vegetarian Starter',
    color: '#15803d',
    vegetarian: true,
    items: [
      { name: 'Spring Rolls (4pcs)', price: 5.95 },
      { name: 'Vegetable Samosa (4 Pcs)', price: 5.95 },
      { name: 'Batatawada (4 Pcs)', price: 5.95 },
      { name: 'Chilli Paneer', price: 8.95 },
      { name: 'Chilli Garlic Mushroom', price: 7.95 },
      { name: 'Garlic Chilli Mogo', price: 6.95 },
      { name: 'Chilli Fries', price: 5.95 },
      { name: 'Crispy Potato Bhajia', price: 5.95 },
      { name: 'Mix Pakora', price: 5.95 },
      { name: 'Paneer Pakora (6 Pcs)', price: 8.95 },
      { name: 'Daal Bhajia (4 Pcs)', price: 5.95 },
    ],
  },
  {
    name: 'Vegetarian Main Course',
    color: '#166534',
    vegetarian: true,
    items: [
      { name: 'Aloo Dum', price: 6.95 },
      { name: 'Aloo Gobi Mater', price: 6.95 },
      { name: 'Chana Masala', price: 6.95 },
      { name: 'Tarka Dal', price: 6.95 },
      { name: 'Dal Makhani', price: 6.95 },
      { name: 'Mater Paneer', price: 7.95 },
    ],
  },
  {
    name: 'Non-Veg Starter',
    color: '#b45309',
    items: [
      { name: 'Fish Pakora', price: 8.95 },
      { name: 'Chicken Samosa (4 Pcs)', price: 5.95 },
      { name: 'Chilli Garlic Prawn', price: 9.95 },
      { name: 'Mutton Roll (4 Pcs)', price: 6.95 },
      { name: 'Chicken Lollypop (5 Pcs)', price: 8.95 },
      { name: 'Chicken Wings', price: 7.95 },
      { name: 'Newa Che Mix Grill', price: 16.95 },
      { name: 'Chicken Sekuwa', price: 9.95 },
      { name: 'Tandoori Chicken (Half)', price: 9.95 },
      { name: 'Shish Kebab', price: 9.95 },
      { name: 'Lamb Chops', price: 10.95 },
      { name: 'Tandoori King Prawn', price: 14.95 },
    ],
  },
  {
    name: 'Non-Veg Main Course',
    color: '#c2410c',
    items: [
      { name: 'Chicken Curry', price: 9.95 },
      { name: 'Chicken Keema Curry', price: 10.95 },
      { name: 'Chicken on the bone', price: 10.95 },
      { name: 'Butter Chicken', price: 11.95 },
      { name: 'Chicken Tikka Masala', price: 11.95 },
      { name: 'Lamb Curry', price: 10.95 },
      { name: 'Goat curry on the Bone', price: 11.95 },
      { name: 'Lamb Keema', price: 11.95 },
    ],
  },
  {
    name: 'Biryani',
    color: '#a16207',
    items: [
      { name: 'Vegetable Biryani', price: 9.95, vegetarian: true, description: 'Served with raita or curry sauce' },
      { name: 'Chicken Biryani', price: 10.95, description: 'Served with raita or curry sauce' },
      { name: 'Lamb Biryani', price: 11.95, description: 'Served with raita or curry sauce' },
      { name: 'King Prawn Biryani', price: 12.95, description: 'Served with raita or curry sauce' },
    ],
  },
  {
    name: 'Sides',
    color: '#57534e',
    items: [
      { name: 'Boiled Rice', price: 3, vegetarian: true },
      { name: 'Pilau Rice', price: 3.5, vegetarian: true },
      { name: 'Jeera Rice', price: 3.95, vegetarian: true },
      { name: 'Keema Rice', price: 4.95 },
      { name: 'Flavoured Chicken Chilli Garlic Fried Rice', price: 5.95 },
      { name: 'Egg Fried Rice', price: 4.95 },
      { name: 'Nan', price: 2.5, vegetarian: true },
      { name: 'Chilli Nan', price: 2.95, vegetarian: true },
      { name: 'Chilli Garlic Nan', price: 2.95, vegetarian: true },
      { name: 'Peshawari Nan', price: 2.95, vegetarian: true },
      { name: 'Keema Nan', price: 3.95 },
      { name: 'Roti', price: 1.5, vegetarian: true },
      { name: 'Plain Paratha', price: 3.5, vegetarian: true },
      { name: 'Mula Ko Achar', price: 2, vegetarian: true, available: false },
      { name: 'Chura', price: 2, vegetarian: true },
      { name: 'Guithe', price: 2, vegetarian: true },
      { name: 'Bhatmas Sanduko', price: 4.95, vegetarian: true },
      { name: 'Plain Papad (2pcs)', price: 1, vegetarian: true },
      { name: 'Roasted Papad (2pcs)', price: 1, vegetarian: true },
      { name: 'Masala Papad (2pcs)', price: 2, vegetarian: true },
      { name: 'Chilli Peanuts', price: 2.5, vegetarian: true },
      { name: 'Chilli Peanuts Mix', price: 4, vegetarian: true },
      { name: 'Nepali Salad', price: 4, vegetarian: true },
    ],
  },
  {
    name: 'Dessert',
    color: '#9d174d',
    vegetarian: true,
    items: [
      { name: 'Firni (Sweet / Sanda)', price: 3.5 },
      { name: 'Gulab Jamun (2pcs)', price: 4 },
      { name: 'Yomari (2 pcs)', price: 3.95, description: 'Sweet rice dumpling filled with chaku (jaggery) or khoa' },
    ],
  },
  {
    name: 'Drinks',
    color: '#1d4ed8',
    items: [
      { name: 'Bottled Soft Drink (330ml)', price: 2.5, vegetarian: true },
      { name: 'Mango Lassi', price: 3.99, vegetarian: true },
      { name: 'Redbull', price: 3 },
      { name: 'Coconut Juice (330ml)', price: 3.5, vegetarian: true },
    ],
  },
]

async function api(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Cookie: `kaji_order_session=${COOKIE}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text }
  }
  if (!res.ok) {
    throw new Error(`${options.method ?? 'GET'} ${path} ${res.status}: ${JSON.stringify(json)}`)
  }
  return json
}

async function main() {
  const current = await api('/api/menu/categories')
  const existingCats = new Map(
    (current.categories ?? []).map((c) => [c.name.toLowerCase(), c])
  )

  let createdCats = 0
  let createdItems = 0
  let skippedItems = 0

  for (const [index, category] of MENU.entries()) {
    let cat = existingCats.get(category.name.toLowerCase())
    if (!cat) {
      const created = await api('/api/menu/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: category.name,
          color: category.color,
          sort_order: index,
        }),
      })
      cat = created.category
      existingCats.set(category.name.toLowerCase(), cat)
      createdCats += 1
      process.stdout.write(`+ category ${category.name}\n`)
    }

    const existingNames = new Set(
      (cat.items ?? []).map((item) => item.name.toLowerCase())
    )

    for (const [itemIndex, item] of category.items.entries()) {
      if (existingNames.has(item.name.toLowerCase())) {
        skippedItems += 1
        continue
      }
      const vegetarian = Boolean(item.vegetarian || category.vegetarian)
      await api('/api/menu/products', {
        method: 'POST',
        body: JSON.stringify({
          category_id: cat.id,
          name: item.name,
          description: item.description ?? '',
          price: item.price,
          available: item.available !== false,
          is_bundle: Boolean(item.bundle),
          pricing_type: item.bundle ? 'BUNDLE' : 'FIXED',
          is_vegetarian: vegetarian,
          spice_level: item.spice ?? null,
          sort_order: itemIndex,
        }),
      })
      createdItems += 1
      existingNames.add(item.name.toLowerCase())
    }
  }

  const check = await api('/api/menu/categories')
  const totalItems = (check.categories ?? []).reduce(
    (sum, cat) => sum + (cat.items?.length ?? 0),
    0
  )
  console.log(
    JSON.stringify(
      {
        createdCats,
        createdItems,
        skippedItems,
        categories: check.categories?.length ?? 0,
        items: totalItems,
      },
      null,
      2
    )
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
