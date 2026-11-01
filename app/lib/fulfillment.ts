export function singleFulfillmentLabel(
  collectionEnabled: boolean,
  deliveryEnabled: boolean
): 'Collection only' | 'Delivery only' | null {
  if (collectionEnabled && !deliveryEnabled) return 'Collection only'
  if (deliveryEnabled && !collectionEnabled) return 'Delivery only'
  return null
}

export function basketOrderTypeLabel(
  collectionEnabled: boolean,
  deliveryEnabled: boolean
): string {
  return singleFulfillmentLabel(collectionEnabled, deliveryEnabled) ?? 'Collection'
}

export function fulfillmentSummaryLabel(
  collectionEnabled: boolean,
  deliveryEnabled: boolean
): string {
  if (collectionEnabled && deliveryEnabled) return 'Collection and delivery'
  return basketOrderTypeLabel(collectionEnabled, deliveryEnabled)
}
