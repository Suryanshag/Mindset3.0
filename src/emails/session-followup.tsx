import { Text, Section } from '@react-email/components'
import EmailLayout from './components/email-layout'
import EmailButton from './components/email-button'
import EmailInfoCard from './components/email-info-card'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

interface SessionFollowupProps {
  userName: string
  doctorName: string
  sessionDate: Date
}

const IST = 'Asia/Kolkata'

export default function SessionFollowupEmail({
  userName,
  doctorName,
  sessionDate,
}: SessionFollowupProps) {
  const istDate = toZonedTime(sessionDate, IST)
  const formattedDate = format(istDate, 'EEEE, MMMM d')
  const formattedTime = format(istDate, 'h:mm a') + ' IST'

  return (
    <EmailLayout preview={`How did your session with ${doctorName} go?`}>
      <Text style={{
        fontSize: '26px',
        fontWeight: '700',
        color: '#0f172a',
        margin: '0 0 8px',
      }}>
        How did it go? 💙
      </Text>
      <Text style={{
        fontSize: '16px',
        color: '#64748b',
        margin: '0 0 24px',
        lineHeight: '1.7',
      }}>
        Hi {userName}, your session time with {doctorName}{' '}
        has passed. We hope it went well and you are
        feeling supported.
      </Text>

      <EmailInfoCard items={[
        { label: 'Doctor', value: doctorName },
        { label: 'Scheduled', value: `${formattedDate} at ${formattedTime}` },
      ]} accentColor="#8b5cf6" />

      <Section style={{
        backgroundColor: '#faf5ff',
        borderRadius: '8px',
        padding: '20px 24px',
        border: '1px solid #e9d5ff',
        margin: '0 0 28px',
      }}>
        <Text style={{
          fontSize: '14px',
          color: '#6b21a8',
          margin: '0 0 12px',
          fontWeight: '600',
        }}>
          Taking care of yourself after a session:
        </Text>
        {[
          'Take a few minutes to reflect on what you discussed',
          'Be gentle with yourself — healing takes time',
          'Note any thoughts or feelings to share next time',
          'Reach out if you need support before your next session',
        ].map((tip, i) => (
          <Text key={i} style={{
            fontSize: '13px',
            color: '#7c3aed',
            margin: '0 0 6px',
            lineHeight: '1.6',
          }}>
            · {tip}
          </Text>
        ))}
      </Section>

      <Section style={{
        textAlign: 'center' as const,
        margin: '0 0 16px',
      }}>
        <EmailButton
          href={`${process.env.NEXT_PUBLIC_APP_URL}/user/sessions/book`}
        >
          Book Your Next Session
        </EmailButton>
      </Section>

      <Text style={{
        fontSize: '13px',
        color: '#94a3b8',
        margin: '0',
        lineHeight: '1.6',
        fontStyle: 'italic' as const,
        textAlign: 'center' as const,
      }}>
        If you missed this session and need to rebook,
        we are here whenever you are ready.
      </Text>
    </EmailLayout>
  )
}
