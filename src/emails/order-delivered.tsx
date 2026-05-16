import { Text, Section } from '@react-email/components'
import EmailLayout from './components/email-layout'
import EmailButton from './components/email-button'
import { APP_BASE_URL } from '@/lib/email-config'

interface OrderDeliveredProps {
  userName: string
  orderId: string
  orderNumber?: string | null
}

export default function OrderDeliveredEmail({
  userName,
  orderId,
  orderNumber,
}: OrderDeliveredProps) {
  const shortOrderId = orderNumber ?? orderId.slice(-8).toUpperCase()

  return (
    <EmailLayout preview={`Your order #${shortOrderId} has been delivered!`}>
      <Text style={{
        fontSize: '26px',
        fontWeight: '700',
        color: '#0f172a',
        margin: '0 0 8px',
      }}>
        Your Order Has Arrived
      </Text>
      <Text style={{
        fontSize: '16px',
        color: '#64748b',
        margin: '0 0 24px',
        lineHeight: '1.6',
      }}>
        Hi {userName}, your order has been successfully delivered!
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

      <Text style={{
        fontSize: '14px',
        color: '#64748b',
        margin: '0 0 32px',
        lineHeight: '1.6',
      }}>
        We hope you love your purchase. If you have any issues,
        feel free to reach out to our support team.
      </Text>

      <Section style={{ textAlign: 'center' as const }}>
        <EmailButton
          href={`${APP_BASE_URL}/user/orders`}
        >
          View Your Orders
        </EmailButton>
      </Section>
    </EmailLayout>
  )
}
