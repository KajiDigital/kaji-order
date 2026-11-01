import { itemLineTotal, type AppliedDiscount, type BasketItem } from './basket'

export function buildPromoItems(items: BasketItem[]) {
  return items.map((item) => ({
    menuItemId: item.menuItemId,
    categoryId: item.categoryId ?? '',
    quantity: item.quantity,
    lineTotalPence: itemLineTotal(item),
    unitPricePence: Math.round(itemLineTotal(item) / item.quantity),
  }))
}

export function discountFromValidation(
  data: {
    valid?: boolean
    promotion_id?: string
    coupon_code?: string
    discount_pence?: number
    description?: string
    discount_type?: string
  },
  fallbackCode?: string
): AppliedDiscount | null {
  if (!data.valid || !data.discount_pence) return null
  return {
    promotion_id: data.promotion_id ?? '',
    coupon_code: data.coupon_code ?? fallbackCode,
    discount_pence: data.discount_pence,
    description: data.description ?? 'Discount',
    discount_type: data.discount_type,
    auto: !data.coupon_code && !fallbackCode,
  }
}

export async function validateBasketPromotion(input: {
  slug: string
  items: BasketItem[]
  code?: string
  autoApply?: boolean
  customerPhone?: string
}) {
  const res = await fetch('/api/promotions/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: input.slug,
      subtotal: input.items.reduce((sum, item) => sum + itemLineTotal(item), 0),
      items: buildPromoItems(input.items),
      code: input.code,
      auto_apply: input.autoApply === true,
      customer_phone: input.customerPhone || undefined,
    }),
  })
  return res.json()
}
