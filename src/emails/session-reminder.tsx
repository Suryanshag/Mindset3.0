import { Text, Section } from '@react-email/components'
import EmailLayout from './components/email-layout'
import EmailButton from './components/email-button'
import EmailInfoCard from './components/email-info-card'
import { formatSessionDateLong } from '@/lib/format-date'

interface SessionReminderProps {
  userName: string
  doctorName: string
  sessionDate: Date
  meetLink: string | null
  hoursUntil: number
}

export default function SessionReminderEmail({
  userName,
  doctorName,
  sessionDate,
  meetLink,
  hoursUntil,
}: SessionReminderProps) {
  const formattedWhen = formatSessionDateLong(sessionDate)

  return (
    <EmailLayout preview={`Reminder: Your session with ${doctorName} is in ${hoursUntil} hours`}>
      <Text style={{
        fontSize: '26px',
        fontWeight: '700',
        color: '#0f172a',
        margin: '0 0 8px',
      }}>
        Session Reminder 🔔
      </Text>
      <Text style={{
        fontSize: '16px',
        color: '#64748b',
        margin: '0 0 24px',
        lineHeight: '1.6',
      }}>
        Hi {userName}, your session with {doctorName} is
        coming up in <strong>{hoursUntil} hours</strong>.
      </Text>

      <EmailInfoCard items={[
        { label: 'Doctor', value: doctorName },
        { label: 'When', value: formattedWhen },
      ]} accentColor="#f59e0b" />

      {meetLink && (
        <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
          <EmailButton href={meetLink}>
            Join Google Meet
          </EmailButton>
        </Section>
      )}

      <Text style={{
        fontSize: '13px',
        color: '#94a3b8',
        margin: '24px 0 0',
        lineHeight: '1.6',
      }}>
        Make sure you are in a calm, private space
        5 minutes before your session starts.
      </Text>
    </EmailLayout>
  )
}
