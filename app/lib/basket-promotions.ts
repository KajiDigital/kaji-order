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

export function discountLabel(discount?: AppliedDiscount | null): string {
  if (!discount) return 'Discount'
  if (discount.coupon_code) return `Discount (${discount.coupon_code})`
  return discount.description || 'Discount'
}

export function promotionNotice(data: {
  description?: string
  discount_type?: string
  happy_hour_ends_in_mins?: number
  coupon_code?: string
}): string {
  if (data.discount_type === 'BUY_X_GET_Y') return data.description ?? ''
  if (data.discount_type === 'HAPPY_HOUR' && data.happy_hour_ends_in_mins) {
    return `${data.description} — ends in ${data.happy_hour_ends_in_mins} min`
  }
  if (!data.coupon_code && data.description) return `${data.description} applied automatically`
  return ''
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
  hints?: boolean
  checkFreeItem?: boolean
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
      hints: input.hints === true,
      check_free_item: input.checkFreeItem === true,
    }),
  })
  return res.json()
}
