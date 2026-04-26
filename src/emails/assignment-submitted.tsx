import { Text, Section } from '@react-email/components'
import EmailLayout from './components/email-layout'
import EmailButton from './components/email-button'
import EmailInfoCard from './components/email-info-card'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const IST = 'Asia/Kolkata'

interface AssignmentSubmittedProps {
  doctorName: string
  userName: string
  assignmentTitle: string
  submittedAt: Date
}

export default function AssignmentSubmittedEmail({
  doctorName,
  userName,
  assignmentTitle,
  submittedAt,
}: AssignmentSubmittedProps) {
  const formattedDate = format(
    toZonedTime(submittedAt, IST),
    'MMMM d, yyyy h:mm a'
  ) + ' IST'

  return (
    <EmailLayout preview={`${userName} submitted: ${assignmentTitle}`}>
      <Text style={{
        fontSize: '26px',
        fontWeight: '700',
        color: '#0f172a',
        margin: '0 0 8px',
      }}>
        Assignment Submitted ✓
      </Text>
      <Text style={{
        fontSize: '16px',
        color: '#64748b',
        margin: '0 0 24px',
        lineHeight: '1.6',
      }}>
        Hi {doctorName}, one of your patients has submitted
        an assignment and is awaiting your review.
      </Text>

      <EmailInfoCard items={[
        { label: 'Assignment', value: assignmentTitle },
        { label: 'Submitted by', value: userName },
        { label: 'Submitted at', value: formattedDate },
      ]} accentColor="#10b981" />

      <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
        <EmailButton
          href={`${process.env.NEXT_PUBLIC_APP_URL}/doctor/assignments`}
        >
          Review Assignment
        </EmailButton>
      </Section>
    </EmailLayout>
  )
}
