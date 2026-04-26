const SHIPROCKET_API = 'https://apiv2.shiprocket.in/v1/external'

// In-memory token cache
let cachedToken: string | null = null
let tokenExpiry: Date | null = null

async function getToken(): Promise<string> {
  if (
    cachedToken &&
    tokenExpiry &&
    tokenExpiry > new Date(Date.now() + 5 * 60 * 1000)
  ) {
    return cachedToken
  }

  console.log('[SHIPROCKET] Refreshing auth token...')

  const res = await fetch(`${SHIPROCKET_API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Shiprocket auth failed: ${error}`)
  }

  const data = await res.json()

  if (!data.token) {
    throw new Error('Shiprocket auth: no token in response')
  }

  cachedToken = data.token
  tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

  console.log('[SHIPROCKET] Token refreshed successfully')
  return cachedToken!
}

async function shiprocketRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken()

  const res = await fetch(`${SHIPROCKET_API}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Shiprocket API error (${res.status}): ${error}`)
  }

  return res.json()
}

export interface ShiprocketAddress {
  name: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  pincode: string
  phone: string
  email: string
}

export interface ShiprocketOrderItem {
  name: string
  sku: string
  units: number
  selling_price: number
}

export interface CreateShipmentInput {
  orderId: string
  orderDate: Date
  channelOrderId: string
  billingAddress: ShiprocketAddress
  shippingAddress: ShiprocketAddress
  items: ShiprocketOrderItem[]
  totalAmount: number
  paymentMethod: 'Prepaid'
  subTotal: number
  length: number
  breadth: number
  height: number
  weight: number
}

export interface ShipmentResponse {
  order_id: number
  shipment_id: number
  status: string
  status_code: number
  onboarding_completed_now: number
  awb_code: string
  courier_company_id: number
  courier_name: string
}

export async function createShipment(
  input: CreateShipmentInput
): Promise<ShipmentResponse> {
  console.log('[SHIPROCKET] Creating shipment for order:', input.channelOrderId)

  const istDate = new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Kolkata',
  }).format(input.orderDate)

  // Format: DD/MM/YYYY → YYYY-MM-DD
  const [dd, mm, yyyy] = istDate.split('/')
  const formattedDate = `${yyyy}-${mm}-${dd}`

  const payload = {
    order_id: input.channelOrderId,
    order_date: formattedDate,
    pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION,
    channel_id: process.env.SHIPROCKET_CHANNEL_ID
      ? parseInt(process.env.SHIPROCKET_CHANNEL_ID)
      : undefined,
    billing_customer_name: input.billingAddress.name.split(' ')[0],
    billing_last_name:
      input.billingAddress.name.split(' ').slice(1).join(' ') || '',
    billing_address: input.billingAddress.addressLine1,
    billing_address_2: input.billingAddress.addressLine2 || '',
    billing_city: input.billingAddress.city,
    billing_pincode: input.billingAddress.pincode,
    billing_state: input.billingAddress.state,
    billing_country: 'India',
    billing_email: input.billingAddress.email,
    billing_phone: input.billingAddress.phone,
    shipping_is_billing: true,
    order_items: input.items.map((item) => ({
      name: item.name,
      sku: item.sku,
      units: item.units,
      selling_price: item.selling_price,
    })),
    payment_method: input.paymentMethod,
    sub_total: input.subTotal,
    length: input.length,
    breadth: input.breadth,
    height: input.height,
    weight: input.weight,
  }

  const response = await shiprocketRequest<ShipmentResponse>(
    '/orders/create/adhoc',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  )

  console.log('[SHIPROCKET] Shipment created:', {
    orderId: response.order_id,
    shipmentId: response.shipment_id,
    awb: response.awb_code,
    courier: response.courier_name,
  })

  return response
}

export async function trackShipment(awbCode: string): Promise<{
  current_status: string
  current_timestamp: string
  delivered_date: string | null
  etd: string | null
  shipment_track_activities: Array<{
    date: string
    activity: string
    location: string
  }>
}> {
  console.log('[SHIPROCKET] Tracking AWB:', awbCode)

  const response = await shiprocketRequest<{
    tracking_data: {
      track_status: number
      shipment_status: string
      shipment_track: Array<{
        current_status: string
        delivered_date: string | null
        etd: string
        shipment_track_activities: Array<{
          date: string
          activity: string
          location: string
        }>
      }>
    }
  }>(`/courier/track/awb/${awbCode}`)

  const trackData = response.tracking_data?.shipment_track?.[0]

  return {
    current_status: trackData?.current_status ?? 'Unknown',
    current_timestamp: new Date().toISOString(),
    delivered_date: trackData?.delivered_date ?? null,
    etd: trackData?.etd ?? null,
    shipment_track_activities:
      trackData?.shipment_track_activities ?? [],
  }
}

export async function cancelShipment(
  shiprocketOrderIds: number[]
): Promise<{ message: string }> {
  console.log('[SHIPROCKET] Cancelling orders:', shiprocketOrderIds)

  return shiprocketRequest<{ message: string }>('/orders/cancel', {
    method: 'POST',
    body: JSON.stringify({ ids: shiprocketOrderIds }),
  })
}

// Courier serviceability

export interface CourierOption {
  courierId: number
  courierName: string
  rate: number
  estimatedDays: string
  cod: boolean
}

export function getPickupPincode(): string {
  return process.env.SHIPROCKET_PICKUP_PINCODE ?? ''
}

export async function getServiceableCouriers(input: {
  pickupPostcode: string
  deliveryPostcode: string
  weight: number
  cod: number
}): Promise<CourierOption[]> {
  console.log('[SHIPROCKET] Checking serviceability...')

  const params = new URLSearchParams({
    pickup_postcode: input.pickupPostcode,
    delivery_postcode: input.deliveryPostcode,
    weight: input.weight.toString(),
    cod: input.cod.toString(),
  })

  const response = await shiprocketRequest<{
    data: {
      available_courier_companies: Array<{
        courier_company_id: number
        courier_name: string
        rate: number
        estimated_delivery_days: string
        cod: number
      }>
    }
  }>(`/courier/serviceability/?${params.toString()}`)

  const companies =
    response.data?.available_courier_companies ?? []

  return companies
    .map((c) => ({
      courierId: Number(c.courier_company_id),
      courierName: String(c.courier_name || 'Unknown'),
      rate: Number(c.rate),
      estimatedDays: String(c.estimated_delivery_days ?? '3-5'),
      cod: c.cod === 1,
    }))
    .filter((c) => isFinite(c.courierId) && c.courierId > 0 && isFinite(c.rate) && c.rate >= 0)
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 5)
}

export async function generateAWB(
  shipmentId: number,
  courierId: number
): Promise<{ awb_code: string }> {
  return shiprocketRequest<{
    response: { data: { awb_code: string } }
  }>('/courier/assign/awb', {
    method: 'POST',
    body: JSON.stringify({
      shipment_id: shipmentId,
      courier_id: courierId,
    }),
  }).then((res) => ({
    awb_code: res.response?.data?.awb_code ?? '',
  }))
}
