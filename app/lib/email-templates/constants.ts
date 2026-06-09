export const EMAIL_TEMPLATE_TYPES = [
  'order_confirmation',
  'new_order_alert',
  'refund_confirmation',
] as const

export type EmailTemplateType = (typeof EMAIL_TEMPLATE_TYPES)[number]

export const EMAIL_TEMPLATE_LABELS: Record<EmailTemplateType, string> = {
  order_confirmation: 'Order Confirmation',
  new_order_alert: 'New Order Alert',
  refund_confirmation: 'Refund',
}

export const EMAIL_TEMPLATE_VARIABLES: Record<EmailTemplateType, string[]> = {
  order_confirmation: [
    'order_number',
    'order_date',
    'restaurant_name',
    'logo_url',
    'primary_color',
    'customer_name',
    'customer_email',
    'customer_phone',
    'prep_time',
    'order_type_message',
    'order_type',
    'items (each: name, quantity, price)',
    'subtotal',
    'service_fee',
    'total',
    'notes',
    'restaurant_phone',
    'restaurant_email',
    'restaurant_address',
    'year',
    'show_powered_by',
  ],
  new_order_alert: [
    'order_number',
    'restaurant_name',
    'customer_name',
    'customer_phone',
    'items (each: name, quantity, price)',
    'total',
    'notes',
    'dashboard_url',
    'accept_url',
    'reject_url',
    'time_received',
    'year',
  ],
  refund_confirmation: [
    'order_number',
    'customer_name',
    'restaurant_name',
    'amount',
    'primary_color',
    'year',
  ],
}
