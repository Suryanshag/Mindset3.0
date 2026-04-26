import { Text, Section } from '@react-email/components'
import EmailLayout from './components/email-layout'
import EmailButton from './components/email-button'
import EmailInfoCard from './components/email-info-card'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const IST = 'Asia/Kolkata'

interface NgoJoinConfirmationProps {
  userName: string
  ngoName: string
  visitDate: Date
  location: string
  whatsappLink: string | null
}

export default function NgoJoinConfirmationEmail({
  userName,
  ngoName,
  visitDate,
  location,
  whatsappLink,
}: NgoJoinConfirmationProps) {
  const formattedDate = format(
    toZonedTime(visitDate, IST),
    'EEEE, MMMM d, yyyy'
  )

  return (
    <EmailLayout preview={`You're registered for the ${ngoName} visit!`}>
      <Text style={{
        fontSize: '26px',
        fontWeight: '700',
        color: '#0f172a',
        margin: '0 0 8px',
      }}>
        You&apos;re In! 🌱
      </Text>
      <Text style={{
        fontSize: '16px',
        color: '#64748b',
        margin: '0 0 24px',
        lineHeight: '1.6',
      }}>
        Hi {userName}, thank you for signing up for our
        NGO outreach visit. We are excited to have you
        join us in making a difference.
      </Text>

      <EmailInfoCard items={[
        { label: 'NGO / Organisation', value: ngoName },
        { label: 'Visit Date', value: formattedDate },
        { label: 'Location', value: location },
      ]} accentColor="#10b981" />

      {whatsappLink && (
        <Section style={{
          backgroundColor: '#f0fdf4',
          borderRadius: '8px',
          padding: '16px 20px',
          border: '1px solid #bbf7d0',
          margin: '0 0 32px',
          textAlign: 'center' as const,
        }}>
          <Text style={{
            fontSize: '14px',
            color: '#166534',
            margin: '0 0 12px',
            fontWeight: '500',
          }}>
            Join our WhatsApp group for updates and
            coordination details.
          </Text>
          <EmailButton
            href={whatsappLink}
            variant="secondary"
          >
            Join WhatsApp Group
          </EmailButton>
        </Section>
      )}

      <Text style={{
        fontSize: '13px',
        color: '#94a3b8',
        margin: '24px 0 0',
        lineHeight: '1.6',
        fontStyle: 'italic' as const,
      }}>
        Our team will reach out with further instructions
        closer to the visit date. Thank you for volunteering!
      </Text>
    </EmailLayout>
  )
}
