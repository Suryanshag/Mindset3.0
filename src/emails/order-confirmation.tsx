import { Text, Section, Row, Column, Hr } from '@react-email/components'
import EmailLayout from './components/email-layout'
import EmailButton from './components/email-button'
import { APP_BASE_URL } from '@/lib/email-config'

interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface ShippingAddress {
  name: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  pincode: string
}

interface OrderConfirmationProps {
  userName: string
  orderId: string
  items: OrderItem[]
  totalAmount: number
  shippingAddress: ShippingAddress
  deliveryCharge?: number
  courierName?: string
}

export default function OrderConfirmationEmail({
  userName,
  orderId,
  items,
  totalAmount,
  shippingAddress,
  deliveryCharge,
  courierName,
}: OrderConfirmationProps) {
  const shortOrderId = orderId.slice(-8).toUpperCase()

  return (
    <EmailLayout preview={`Order #${shortOrderId} confirmed — we're packing it!`}>
      <Text style={{
        fontSize: '26px',
        fontWeight: '700',
        color: '#0f172a',
        margin: '0 0 8px',
      }}>
        Order Confirmed 📦
      </Text>
      <Text style={{
        fontSize: '16px',
        color: '#64748b',
        margin: '0 0 24px',
        lineHeight: '1.6',
      }}>
        Hi {userName}, thank you for your order!
        We will notify you once it ships.
      </Text>

      {/* Order ID badge */}
      <Section style={{
        backgroundColor: '#f0fdf4',
        borderRadius: '8px',
        padding: '12px 20px',
        margin: '0 0 24px',
        border: '1px solid #bbf7d0',
      }}>
        <Text style={{
          fontSize: '13px',
          color: '#166534',
          margin: '0',
          fontWeight: '600',
        }}>
          Order ID: #{shortOrderId}
        </Text>
      </Section>

      {/* Order items */}
      <Section style={{
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        padding: '20px 24px',
        border: '1px solid #e2e8f0',
        margin: '0 0 24px',
      }}>
        {items.map((item, i) => (
          <Row key={i} style={{ marginBottom: '12px' }}>
            <Column>
              <Text style={{
                fontSize: '14px',
                color: '#1e293b',
                fontWeight: '500',
                margin: '0',
              }}>
                {item.name}
              </Text>
              <Text style={{
                fontSize: '12px',
                color: '#94a3b8',
                margin: '2px 0 0',
              }}>
                Qty: {item.quantity}
              </Text>
            </Column>
            <Column style={{ textAlign: 'right' as const }}>
              <Text style={{
                fontSize: '14px',
                color: '#1e293b',
                fontWeight: '600',
                margin: '0',
              }}>
                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
              </Text>
            </Column>
          </Row>
        ))}

        <Hr style={{ borderColor: '#e2e8f0', margin: '16px 0' }} />

        {deliveryCharge != null && deliveryCharge > 0 && (
          <Row style={{ marginBottom: '8px' }}>
            <Column>
              <Text style={{
                fontSize: '13px',
                color: '#64748b',
                margin: '0',
              }}>
                Delivery ({courierName || 'Standard'})
              </Text>
            </Column>
            <Column style={{ textAlign: 'right' as const }}>
              <Text style={{
                fontSize: '13px',
                color: '#64748b',
                margin: '0',
              }}>
                {'\u20B9'}{deliveryCharge.toLocaleString('en-IN')}
              </Text>
            </Column>
          </Row>
        )}

        <Row>
          <Column>
            <Text style={{
              fontSize: '15px',
              fontWeight: '700',
              color: '#0f172a',
              margin: '0',
            }}>
              Total
            </Text>
          </Column>
          <Column style={{ textAlign: 'right' as const }}>
            <Text style={{
              fontSize: '15px',
              fontWeight: '700',
              color: '#14b8a6',
              margin: '0',
            }}>
              ₹{totalAmount.toLocaleString('en-IN')}
            </Text>
          </Column>
        </Row>
      </Section>

      {/* Shipping address */}
      <Text style={{
        fontSize: '13px',
        fontWeight: '600',
        color: '#64748b',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
        margin: '0 0 8px',
      }}>
        Shipping To
      </Text>
      <Section style={{
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        padding: '16px 20px',
        border: '1px solid #e2e8f0',
        margin: '0 0 32px',
      }}>
        <Text style={{
          fontSize: '14px',
          color: '#1e293b',
          margin: '0',
          lineHeight: '1.8',
        }}>
          {shippingAddress.name}<br />
          {shippingAddress.addressLine1}<br />
          {shippingAddress.addressLine2 && (
            <>{shippingAddress.addressLine2}<br /></>
          )}
          {shippingAddress.city}, {shippingAddress.state} — {shippingAddress.pincode}
        </Text>
      </Section>

      <Section style={{ textAlign: 'center' as const }}>
        <EmailButton
          href={`${APP_BASE_URL}/user/orders`}
        >
          Track Your Order
        </EmailButton>
      </Section>
    </EmailLayout>
  )
}
