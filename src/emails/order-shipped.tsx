import { Text, Section } from '@react-email/components'
import EmailLayout from './components/email-layout'
import EmailButton from './components/email-button'
import { APP_BASE_URL } from '@/lib/email-config'

interface OrderShippedProps {
  userName: string
  orderId: string
  orderNumber?: string | null
  courierName: string | null
  awbCode: string | null
  trackingUrl: string | null
}

export default function OrderShippedEmail({
  userName,
  orderId,
  orderNumber,
  courierName,
  awbCode,
  trackingUrl,
}: OrderShippedProps) {
  const shortOrderId = orderNumber ?? orderId.slice(-8).toUpperCase()

  return (
    <EmailLayout preview={`Your order #${shortOrderId} has shipped!`}>
      <Text style={{
        fontSize: '26px',
        fontWeight: '700',
        color: '#0f172a',
        margin: '0 0 8px',
      }}>
        Your Order Has Shipped
      </Text>
      <Text style={{
        fontSize: '16px',
        color: '#64748b',
        margin: '0 0 24px',
        lineHeight: '1.6',
      }}>
        Hi {userName}, great news — your order is on its way!
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

      {/* Shipping details */}
      <Section style={{
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        padding: '20px 24px',
        border: '1px solid #e2e8f0',
        margin: '0 0 24px',
      }}>
        {courierName && (
          <Text style={{
            fontSize: '14px',
            color: '#1e293b',
            margin: '0 0 8px',
          }}>
            <strong>Courier:</strong> {courierName}
          </Text>
        )}
        {awbCode && (
          <Text style={{
            fontSize: '14px',
            color: '#1e293b',
            margin: '0 0 8px',
          }}>
            <strong>Tracking Number:</strong> {awbCode}
          </Text>
        )}
        <Text style={{
          fontSize: '13px',
          color: '#64748b',
          margin: '8px 0 0',
        }}>
          You will receive another email once your order is delivered.
        </Text>
      </Section>

      <Section style={{ textAlign: 'center' as const }}>
        <EmailButton
          href={trackingUrl || `${APP_BASE_URL}/user/orders`}
        >
          Track Your Order
        </EmailButton>
      </Section>
    </EmailLayout>
  )
}
