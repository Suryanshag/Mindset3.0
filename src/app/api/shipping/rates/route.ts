import { auth } from '@/lib/auth'
import {
  getServiceableCouriers,
  getPickupPincode,
} from '@/lib/shiprocket'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { z } from 'zod'
import { apiLimiter } from '@/lib/arcjet'
import { handleArcjetDenial } from '@/lib/arcjet-protect'

const schema = z.object({
  deliveryPostcode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  weight: z.coerce.number().positive().max(100).finite(),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return errorResponse('Unauthorized', 401)
    }

    const decision = await apiLimiter.protect(req)
    const denied = handleArcjetDenial(decision)
    if (denied) return denied

    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400)
    }

    const pickupPostcode = getPickupPincode()
    if (!pickupPostcode) {
      return errorResponse('Pickup pincode not configured', 500)
    }

    const couriers = await getServiceableCouriers({
      pickupPostcode,
      deliveryPostcode: parsed.data.deliveryPostcode,
      weight: parsed.data.weight,
      cod: 0,
    })

    const validCouriers = couriers.filter(
      c => c.rate > 0 && c.estimatedDays
    )

    if (validCouriers.length === 0) {
      return errorResponse(
        'No delivery options available for this pincode. Please check the pincode or contact us.',
        400
      )
    }

    // Sort by price to find cheapest
    const byPrice = [...validCouriers].sort((a, b) => a.rate - b.rate)

    // Sort by delivery days to find fastest
    const getDays = (str: string) => {
      const match = str.match(/\d+/)
      return match ? parseInt(match[0]) : 999
    }
    const bySpeed = [...validCouriers].sort(
      (a, b) => getDays(a.estimatedDays) - getDays(b.estimatedDays)
    )

    const cheapest = byPrice[0]
    const fastest = bySpeed[0]

    const options: Array<{
      courierId: number
      courierName: string
      rate: number
      estimatedDays: string
      tag: 'CHEAPEST' | 'FASTEST' | 'CHEAPEST_AND_FASTEST'
    }> = []

    if (cheapest.courierId === fastest.courierId) {
      options.push({ ...cheapest, tag: 'CHEAPEST_AND_FASTEST' })
    } else {
      options.push({ ...cheapest, tag: 'CHEAPEST' })
      options.push({ ...fastest, tag: 'FASTEST' })
    }

    return successResponse({ couriers: options })
  } catch (error) {
    console.error('[SHIPPING_RATES]', error)
    return serverErrorResponse()
  }
}
