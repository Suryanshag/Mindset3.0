import { Text, Section } from '@react-email/components'
import EmailLayout from './components/email-layout'
import EmailButton from './components/email-button'

interface PaymentFailedProps {
  userName: string
  amount: number
  type: 'SESSION' | 'EBOOK' | 'PRODUCT'
  retryUrl: string
}

const typeLabels: Record<string, string> = {
  SESSION: 'therapy session booking',
  EBOOK: 'study material purchase',
  PRODUCT: 'product order',
}

export default function PaymentFailedEmail({
  userName,
  amount,
  type,
  retryUrl,
}: PaymentFailedProps) {
  return (
    <EmailLayout preview="Your payment could not be processed">
      <Text style={{
        fontSize: '26px',
        fontWeight: '700',
        color: '#0f172a',
        margin: '0 0 8px',
      }}>
        Payment Unsuccessful ⚠️
      </Text>
      <Text style={{
        fontSize: '16px',
        color: '#64748b',
        margin: '0 0 24px',
        lineHeight: '1.7',
      }}>
        Hi {userName}, unfortunately your payment of{' '}
        <strong>₹{amount.toLocaleString('en-IN')}</strong>{' '}
        for your {typeLabels[type]} could not be processed.
        Don&apos;t worry — no amount has been deducted.
      </Text>

      <Section style={{
        backgroundColor: '#fff7ed',
        borderRadius: '8px',
        padding: '16px 20px',
        border: '1px solid #fed7aa',
        margin: '0 0 28px',
      }}>
        <Text style={{
          fontSize: '14px',
          color: '#9a3412',
          margin: '0 0 8px',
          fontWeight: '600',
        }}>
          Common reasons for payment failure:
        </Text>
        {[
          'Insufficient balance in your account',
          'Card details entered incorrectly',
          'Bank declined the transaction',
          'Payment session timed out',
        ].map((reason, i) => (
          <Text key={i} style={{
            fontSize: '13px',
            color: '#c2410c',
            margin: '0 0 4px',
          }}>
            · {reason}
          </Text>
        ))}
      </Section>

      <Section style={{ textAlign: 'center' as const, margin: '0 0 24px' }}>
        <EmailButton href={retryUrl}>
          Try Again
        </EmailButton>
      </Section>

      <Text style={{
        fontSize: '13px',
        color: '#94a3b8',
        margin: '0',
        lineHeight: '1.6',
        textAlign: 'center' as const,
      }}>
        If the issue persists, please contact us at{' '}
        support@mindset.com and we will help you complete
        your booking.
      </Text>
    </EmailLayout>
  )
}
