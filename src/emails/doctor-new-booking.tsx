import { Text, Section, Hr } from '@react-email/components'
import EmailLayout from './components/email-layout'
import EmailButton from './components/email-button'
import EmailInfoCard from './components/email-info-card'
import { formatSessionDateLong } from '@/lib/format-date'
import { APP_BASE_URL } from '@/lib/email-config'

interface DoctorNewBookingProps {
  doctorName: string
  userName: string
  sessionDate: Date
  durationMin: number
  sessionId: string
}

const h1Style = {
  fontSize: '24px',
  fontWeight: 700,
  color: '#0f172a',
  margin: '0 0 8px',
  lineHeight: '1.3',
}

const subtitleStyle = {
  fontSize: '16px',
  color: '#475569',
  margin: '0 0 24px',
  lineHeight: '1.6',
}

const noteStyle = {
  fontSize: '14px',
  color: '#334155',
  margin: '0 0 8px',
  lineHeight: '1.6',
}

const footerStyle = {
  fontSize: '13px',
  color: '#94a3b8',
  margin: '24px 0 0',
  lineHeight: '1.6',
}

export default function DoctorNewBookingEmail({
  doctorName,
  userName,
  sessionDate,
  durationMin,
  sessionId,
}: DoctorNewBookingProps) {
  const addLinkUrl = `${APP_BASE_URL}/doctor/calendar?highlight=${sessionId}`
  const dateLong = formatSessionDateLong(sessionDate)

  return (
    <EmailLayout preview={`New session booking from ${userName} — please add a Meet link`}>
      <Text style={h1Style}>New session booking</Text>
      <Text style={subtitleStyle}>
        Hi {doctorName}, you have a new session booking from <strong>{userName}</strong>.
      </Text>

      <EmailInfoCard
        items={[
          { label: 'Patient', value: userName },
          { label: 'When', value: dateLong },
          { label: 'Duration', value: `${durationMin} minutes` },
        ]}
        accentColor="#0b9da9"
      />

      <Text style={{ ...noteStyle, margin: '24px 0 12px', fontWeight: 600 }}>
        Please add a Google Meet link before the session so the patient can join.
      </Text>

      <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
        <EmailButton href={addLinkUrl}>Add Meet link</EmailButton>
      </Section>

      <Text style={noteStyle}>
        Once you add it, the patient will see a Join button on their dashboard
        15 minutes before the session starts.
      </Text>

      <Hr style={{ borderColor: '#e2e8f0', margin: '24px 0' }} />

      <Text style={footerStyle}>
        If you can&apos;t make this session, please cancel or reschedule from the
        same page so we can refund and re-book.
      </Text>
    </EmailLayout>
  )
}
