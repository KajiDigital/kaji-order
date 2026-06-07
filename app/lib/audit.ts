export function logAdminChange(
  adminEmail: string,
  restaurantId: string,
  changes: Record<string, unknown>
) {
  console.log('[admin-audit]', {
    at: new Date().toISOString(),
    admin: adminEmail,
    restaurantId,
    changes,
  })
}
