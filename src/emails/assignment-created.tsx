import { Text, Section } from '@react-email/components'
import EmailLayout from './components/email-layout'
import EmailButton from './components/email-button'
import EmailInfoCard from './components/email-info-card'
import { formatSessionDate } from '@/lib/format-date'
import { APP_BASE_URL } from '@/lib/email-config'

interface AssignmentCreatedProps {
  userName: string
  doctorName: string
  assignmentTitle: string
  dueDate: Date | null
  description: string
}

export default function AssignmentCreatedEmail({
  userName,
  doctorName,
  assignmentTitle,
  dueDate,
  description,
}: AssignmentCreatedProps) {
  const formattedDue = dueDate
    ? formatSessionDate(dueDate)
    : 'No due date set'

  return (
    <EmailLayout preview={`New assignment from ${doctorName}: ${assignmentTitle}`}>
      <Text style={{
        fontSize: '26px',
        fontWeight: '700',
        color: '#0f172a',
        margin: '0 0 8px',
      }}>
        New Assignment 📝
      </Text>
      <Text style={{
        fontSize: '16px',
        color: '#64748b',
        margin: '0 0 24px',
        lineHeight: '1.6',
      }}>
        Hi {userName}, your doctor has created a new
        assignment for you.
      </Text>

      <EmailInfoCard items={[
        { label: 'Assignment', value: assignmentTitle },
        { label: 'Assigned by', value: doctorName },
        { label: 'Due Date', value: formattedDue },
      ]} accentColor="#8b5cf6" />

      {description && (
        <Section style={{
          backgroundColor: '#faf5ff',
          borderRadius: '8px',
          padding: '16px 20px',
          border: '1px solid #e9d5ff',
          margin: '0 0 32px',
        }}>
          <Text style={{
            fontSize: '13px',
            color: '#6b21a8',
            fontWeight: '600',
            margin: '0 0 6px',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.5px',
          }}>
            Instructions
          </Text>
          <Text style={{
            fontSize: '14px',
            color: '#1e293b',
            margin: '0',
            lineHeight: '1.7',
          }}>
            {description}
          </Text>
        </Section>
      )}

      <Section style={{ textAlign: 'center' as const }}>
        <EmailButton
          href={`${APP_BASE_URL}/user/assignments`}
        >
          View Assignment
        </EmailButton>
      </Section>
    </EmailLayout>
  )
}
