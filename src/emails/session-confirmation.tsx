import { Text, Section, Hr } from '@react-email/components'
import EmailLayout from './components/email-layout'
import EmailButton from './components/email-button'
import EmailInfoCard from './components/email-info-card'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

interface SessionConfirmationProps {
  userName: string
  doctorName: string
  doctorDesignation: string
  sessionDate: Date
  meetLink: string | null
}

const IST = 'Asia/Kolkata'

const h1Style = {
  fontSize: '26px',
  fontWeight: '700',
  color: '#0f172a',
  margin: '0 0 8px',
  lineHeight: '1.3',
}

const subtitleStyle = {
  fontSize: '16px',
  color: '#64748b',
  margin: '0 0 24px',
  lineHeight: '1.6',
}

const noteStyle = {
  fontSize: '13px',
  color: '#94a3b8',
  margin: '24px 0 0',
  lineHeight: '1.6',
  fontStyle: 'italic' as const,
}

export default function SessionConfirmationEmail({
  userName,
  doctorName,
  doctorDesignation,
  sessionDate,
  meetLink,
}: SessionConfirmationProps) {
  const istDate = toZonedTime(sessionDate, IST)
  const formattedDate = format(istDate, 'EEEE, MMMM d, yyyy')
  const formattedTime = format(istDate, 'h:mm a') + ' IST'

  return (
    <EmailLayout preview={`Your session with ${doctorName} is confirmed`}>
      <Text style={h1Style}>
        Session Confirmed ✓
      </Text>
      <Text style={subtitleStyle}>
        Hi {userName}, your therapy session has been
        successfully booked and confirmed.
      </Text>

      <EmailInfoCard items={[
        { label: 'Doctor', value: `${doctorName} — ${doctorDesignation}` },
        { label: 'Date', value: formattedDate },
        { label: 'Time', value: formattedTime },
        { label: 'Session Type', value: 'Online via Google Meet' },
      ]} />

      {meetLink ? (
        <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
          <EmailButton href={meetLink}>
            Join Session on Google Meet
          </EmailButton>
        </Section>
      ) : (
        <Section style={{
          backgroundColor: '#fef9c3',
          borderRadius: '8px',
          padding: '16px 20px',
          margin: '24px 0',
          border: '1px solid #fde68a',
        }}>
          <Text style={{
            fontSize: '14px',
            color: '#92400e',
            margin: '0',
          }}>
            Your Google Meet link will be sent separately
            before your session.
          </Text>
        </Section>
      )}

      <Hr style={{ borderColor: '#e2e8f0', margin: '24px 0' }} />

      <Text style={noteStyle}>
        Please ensure you are in a quiet, private space
        before your session. If you need to reschedule,
        please contact us at least 24 hours in advance.
      </Text>
    </EmailLayout>
  )
}
