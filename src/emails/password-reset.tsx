import { Text, Section } from '@react-email/components'
import EmailLayout from './components/email-layout'
import EmailButton from './components/email-button'

interface PasswordResetProps {
  userName: string
  resetUrl: string
  expiresInMinutes: number
}

export default function PasswordResetEmail({
  userName,
  resetUrl,
  expiresInMinutes,
}: PasswordResetProps) {
  return (
    <EmailLayout preview="Reset your Mindset password">
      <Text style={{
        fontSize: '26px',
        fontWeight: '700',
        color: '#0f172a',
        margin: '0 0 8px',
      }}>
        Reset Your Password
      </Text>
      <Text style={{
        fontSize: '16px',
        color: '#64748b',
        margin: '0 0 24px',
        lineHeight: '1.7',
      }}>
        Hi {userName}, we received a request to reset
        your Mindset account password. Click the button
        below to choose a new password.
      </Text>

      <Section style={{
        textAlign: 'center' as const,
        margin: '0 0 24px',
      }}>
        <EmailButton href={resetUrl}>
          Reset My Password
        </EmailButton>
      </Section>

      <Section style={{
        backgroundColor: '#fff7ed',
        borderRadius: '8px',
        padding: '16px 20px',
        border: '1px solid #fed7aa',
        margin: '0 0 24px',
      }}>
        <Text style={{
          fontSize: '13px',
          color: '#9a3412',
          margin: '0',
          lineHeight: '1.6',
        }}>
          This link expires in {expiresInMinutes} minutes.
          If you did not request a password reset,
          please ignore this email — your password
          will remain unchanged.
        </Text>
      </Section>

      <Text style={{
        fontSize: '12px',
        color: '#94a3b8',
        margin: '0',
        lineHeight: '1.6',
      }}>
        For security, this link can only be used once.
        If you need a new link, visit the forgot
        password page again.
      </Text>
    </EmailLayout>
  )
}
