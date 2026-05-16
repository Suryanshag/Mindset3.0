import { Text, Section } from '@react-email/components'
import EmailLayout from './components/email-layout'
import EmailButton from './components/email-button'
import EmailInfoCard from './components/email-info-card'
import { formatSessionDateLong } from '@/lib/format-date'
import { APP_BASE_URL } from '@/lib/email-config'

interface SessionCancelledProps {
  userName: string
  doctorName: string
  sessionDate: Date
  cancelledBy: 'DOCTOR' | 'ADMIN' | 'USER'
  refundNote?: string
}

export default function SessionCancelledEmail({
  userName,
  doctorName,
  sessionDate,
  cancelledBy,
  refundNote,
}: SessionCancelledProps) {
  const formattedDate = formatSessionDateLong(sessionDate)

  const cancelMessage: Record<string, string> = {
    DOCTOR: `Your doctor ${doctorName} had to cancel this session.`,
    ADMIN: 'This session has been cancelled by our team.',
    USER: 'You have successfully cancelled this session.',
  }

  return (
    <EmailLayout preview={`Your session on ${formattedDate} has been cancelled`}>
      <Text style={{
        fontSize: '26px',
        fontWeight: '700',
        color: '#0f172a',
        margin: '0 0 8px',
      }}>
        Session Cancelled
      </Text>
      <Text style={{
        fontSize: '16px',
        color: '#64748b',
        margin: '0 0 24px',
        lineHeight: '1.7',
      }}>
        Hi {userName}, {cancelMessage[cancelledBy]}
      </Text>

      <EmailInfoCard items={[
        { label: 'Doctor', value: doctorName },
        { label: 'When', value: formattedDate },
      ]} accentColor="#ef4444" />

      {refundNote && (
        <Section style={{
          backgroundColor: '#f0fdf4',
          borderRadius: '8px',
          padding: '16px 20px',
          border: '1px solid #bbf7d0',
          margin: '0 0 28px',
        }}>
          <Text style={{
            fontSize: '14px',
            color: '#166534',
            margin: '0',
            fontWeight: '500',
          }}>
            💰 {refundNote}
          </Text>
        </Section>
      )}

      {cancelledBy !== 'USER' && (
        <Section style={{
          textAlign: 'center' as const,
          margin: '0 0 24px',
        }}>
          <EmailButton
            href={`${APP_BASE_URL}/user/sessions/book`}
          >
            Book Another Session
          </EmailButton>
        </Section>
      )}

      <Text style={{
        fontSize: '13px',
        color: '#94a3b8',
        margin: '0',
        lineHeight: '1.6',
        fontStyle: 'italic' as const,
      }}>
        We are sorry for any inconvenience. Your mental
        health journey matters to us — we hope to see
        you again soon.
      </Text>
    </EmailLayout>
  )
}
