import { Text, Section } from '@react-email/components'
import EmailLayout from './components/email-layout'
import EmailButton from './components/email-button'
import EmailInfoCard from './components/email-info-card'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

interface SessionCancelledProps {
  userName: string
  doctorName: string
  sessionDate: Date
  cancelledBy: 'DOCTOR' | 'ADMIN' | 'USER'
  refundNote?: string
}

const IST = 'Asia/Kolkata'

export default function SessionCancelledEmail({
  userName,
  doctorName,
  sessionDate,
  cancelledBy,
  refundNote,
}: SessionCancelledProps) {
  const istDate = toZonedTime(sessionDate, IST)
  const formattedDate = format(istDate, 'EEEE, MMMM d, yyyy')
  const formattedTime = format(istDate, 'h:mm a') + ' IST'

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
        { label: 'Date', value: formattedDate },
        { label: 'Time', value: formattedTime },
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
            href={`${process.env.NEXT_PUBLIC_APP_URL}/user/sessions/book`}
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
