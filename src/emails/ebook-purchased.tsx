import { Text, Section } from '@react-email/components'
import EmailLayout from './components/email-layout'
import EmailButton from './components/email-button'

interface EbookPurchasedProps {
  userName: string
  ebookTitle: string
  amount: number
}

export default function EbookPurchasedEmail({
  userName,
  ebookTitle,
  amount,
}: EbookPurchasedProps) {
  return (
    <EmailLayout preview={`Your purchase of "${ebookTitle}" is confirmed!`}>
      <Text style={{
        fontSize: '26px',
        fontWeight: '700',
        color: '#0f172a',
        margin: '0 0 8px',
      }}>
        Purchase Confirmed 📖
      </Text>
      <Text style={{
        fontSize: '16px',
        color: '#64748b',
        margin: '0 0 24px',
        lineHeight: '1.7',
      }}>
        Hi {userName}, you now have lifetime access to
        your study material. Happy learning!
      </Text>

      <Section style={{
        backgroundColor: '#fffbeb',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #fde68a',
        margin: '0 0 28px',
        textAlign: 'center' as const,
      }}>
        <Text style={{
          fontSize: '13px',
          color: '#92400e',
          fontWeight: '600',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.5px',
          margin: '0 0 8px',
        }}>
          Your Purchase
        </Text>
        <Text style={{
          fontSize: '18px',
          fontWeight: '700',
          color: '#0f172a',
          margin: '0 0 4px',
        }}>
          {ebookTitle}
        </Text>
        <Text style={{
          fontSize: '14px',
          color: '#d97706',
          fontWeight: '600',
          margin: '0',
        }}>
          ₹{amount.toLocaleString('en-IN')} · Lifetime Access
        </Text>
      </Section>

      <Section style={{
        backgroundColor: '#f0fdfa',
        borderRadius: '8px',
        padding: '16px 20px',
        border: '1px solid #99f6e4',
        margin: '0 0 28px',
      }}>
        <Text style={{
          fontSize: '13px',
          color: '#0f766e',
          margin: '0',
          lineHeight: '1.6',
        }}>
          🔒 Your material is protected and watermarked
          with your account details. It is available
          to read anytime from your dashboard —
          on any device.
        </Text>
      </Section>

      <Section style={{ textAlign: 'center' as const, margin: '0 0 24px' }}>
        <EmailButton
          href={`${process.env.NEXT_PUBLIC_APP_URL}/user/ebooks`}
        >
          Read Now
        </EmailButton>
      </Section>
    </EmailLayout>
  )
}
