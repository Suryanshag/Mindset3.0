import { Text, Section } from '@react-email/components'
import EmailLayout from './components/email-layout'
import EmailButton from './components/email-button'
import EmailInfoCard from './components/email-info-card'
import { formatSessionDateLong } from '@/lib/format-date'
import { APP_BASE_URL } from '@/lib/email-config'

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
  const formattedDate = formatSessionDateLong(submittedAt)

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
          href={`${APP_BASE_URL}/doctor/assignments`}
        >
          Review Assignment
        </EmailButton>
      </Section>
    </EmailLayout>
  )
}
