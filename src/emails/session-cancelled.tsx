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
  // Free-form note used by the legacy doctor/admin cancel paths.
  // Sprint Refund-Automation: user-cancel paths set `refundAmount` +
  // `refundPercent` + `cancellationReason` instead and the template
  // renders the richer block. If both are present, the structured
  // block wins.
  refundNote?: string
  refundAmount?: number       // in rupees
  refundPercent?: number      // 100 / 50 / 0
  cancellationReason?: string
}

export default function SessionCancelledEmail({
  userName,
  doctorName,
  sessionDate,
  cancelledBy,
  refundNote,
  refundAmount,
  refundPercent,
  cancellationReason,
}: SessionCancelledProps) {
  const formattedDate = formatSessionDateLong(sessionDate)

  const cancelMessage: Record<string, string> = {
    DOCTOR: `Your doctor ${doctorName} had to cancel this session.`,
    ADMIN: 'This session has been cancelled by our team.',
    USER: 'You have successfully cancelled this session.',
  }

  // Prefer the structured refund block when available (user-initiated
  // cancel path). The legacy refundNote rendering below is the fallback
  // for doctor/admin paths until they migrate to the same contract.
  const hasStructuredRefund = typeof refundPercent === 'number'
  const refundCopy = hasStructuredRefund
    ? refundAmount !== undefined && refundAmount > 0
      ? `${refundPercent}% refund (₹${refundAmount.toFixed(0)}) is processing. Expect 5-7 business days for the amount to reflect in your account.`
      : 'No refund is due as the cancellation was after the session start time.'
    : null

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

      {hasStructuredRefund && refundCopy && (
        <Section style={{
          backgroundColor: refundAmount && refundAmount > 0 ? '#f0fdf4' : '#fef2f2',
          borderRadius: '8px',
          padding: '16px 20px',
          border: `1px solid ${refundAmount && refundAmount > 0 ? '#bbf7d0' : '#fecaca'}`,
          margin: '0 0 12px',
        }}>
          <Text style={{
            fontSize: '14px',
            color: refundAmount && refundAmount > 0 ? '#166534' : '#7f1d1d',
            margin: '0',
            fontWeight: '500',
          }}>
            💰 {refundCopy}
          </Text>
          {cancellationReason && (
            <Text style={{
              fontSize: '12px',
              color: refundAmount && refundAmount > 0 ? '#15803d' : '#991b1b',
              margin: '6px 0 0',
              fontStyle: 'italic' as const,
            }}>
              {cancellationReason}
            </Text>
          )}
        </Section>
      )}
      {!hasStructuredRefund && refundNote && (
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
