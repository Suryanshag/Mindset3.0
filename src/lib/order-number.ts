import type { Prisma } from '@prisma/client'

/**
 * Generates the next human-readable order number for the given year.
 *
 * Format: MN-YYYY-NNN  (e.g. MN-2026-007)
 *
 * Must be called inside a $transaction so the count + insert are atomic;
 * otherwise two simultaneous orders can race and produce duplicates.
 */
export async function generateOrderNumber(
  tx: Prisma.TransactionClient,
  now: Date = new Date()
): Promise<string> {
  const year = now.getUTCFullYear()
  const startOfYear = new Date(Date.UTC(year, 0, 1))
  const startOfNextYear = new Date(Date.UTC(year + 1, 0, 1))

  const countThisYear = await tx.order.count({
    where: {
      createdAt: { gte: startOfYear, lt: startOfNextYear },
      orderNumber: { not: null },
    },
  })

  return `MN-${year}-${String(countThisYear + 1).padStart(3, '0')}`
}
