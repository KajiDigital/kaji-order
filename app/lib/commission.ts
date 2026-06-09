type CommissionRecordLike = {
  food_commission_pence: number
  service_fee_pence: number
  total_platform_pence: number
  commission_pence: number
}

export function recordFoodCommission(record: CommissionRecordLike): number {
  if (record.food_commission_pence > 0) return record.food_commission_pence
  return record.commission_pence
}

export function recordServiceFee(record: CommissionRecordLike): number {
  return record.service_fee_pence
}

export function recordTotalPlatform(record: CommissionRecordLike): number {
  if (record.total_platform_pence > 0) return record.total_platform_pence
  return record.commission_pence
}

export function sumPlatformRevenue(records: CommissionRecordLike[]) {
  return records.reduce(
    (acc, record) => {
      acc.foodCommission += recordFoodCommission(record)
      acc.serviceFees += recordServiceFee(record)
      acc.totalPlatform += recordTotalPlatform(record)
      return acc
    },
    { foodCommission: 0, serviceFees: 0, totalPlatform: 0 }
  )
}
