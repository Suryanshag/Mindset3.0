import { Text, Section } from '@react-email/components'
import EmailLayout from './components/email-layout'
import EmailButton from './components/email-button'

interface EmailVerificationProps {
  userName: string
  verifyUrl: string
  expiresInHours: number
}

export default function EmailVerificationEmail({
  userName,
  verifyUrl,
  expiresInHours,
}: EmailVerificationProps) {
  return (
    <EmailLayout preview="Verify your Mindset email">
      <Text style={{
        fontSize: '26px',
        fontWeight: '700',
        color: '#0f172a',
        margin: '0 0 8px',
      }}>
        Verify Your Email
      </Text>
      <Text style={{
        fontSize: '16px',
        color: '#64748b',
        margin: '0 0 24px',
        lineHeight: '1.7',
      }}>
        Hi {userName}, please confirm your email address to finish
        setting up your Mindset account. Verifying lets you book
        sessions and keep your account secure.
      </Text>

      <Section style={{ textAlign: 'center' as const, margin: '0 0 24px' }}>
        <EmailButton href={verifyUrl}>Verify My Email</EmailButton>
      </Section>

      <Section style={{
        backgroundColor: '#f0f9ff',
        borderRadius: '8px',
        padding: '16px 20px',
        border: '1px solid #bae6fd',
        margin: '0 0 24px',
      }}>
        <Text style={{
          fontSize: '13px',
          color: '#075985',
          margin: '0',
          lineHeight: '1.6',
        }}>
          This link expires in {expiresInHours} hours. If you didn&apos;t
          create a Mindset account, please ignore this email.
        </Text>
      </Section>

      <Text style={{
        fontSize: '12px',
        color: '#94a3b8',
        margin: '0',
        lineHeight: '1.6',
      }}>
        For security, this link can only be used once.
      </Text>
    </EmailLayout>
  )
}
