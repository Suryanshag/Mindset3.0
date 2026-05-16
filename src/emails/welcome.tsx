import { Text, Section } from '@react-email/components'
import EmailLayout from './components/email-layout'
import EmailButton from './components/email-button'
import { APP_BASE_URL } from '@/lib/email-config'

interface WelcomeProps {
  userName: string
}

export default function WelcomeEmail({ userName }: WelcomeProps) {
  return (
    <EmailLayout preview={`Welcome to Mindset, ${userName}!`}>
      <Text style={{
        fontSize: '28px',
        fontWeight: '700',
        color: '#0f172a',
        margin: '0 0 8px',
        lineHeight: '1.3',
      }}>
        Welcome to Mindset 🌱
      </Text>
      <Text style={{
        fontSize: '16px',
        color: '#64748b',
        margin: '0 0 24px',
        lineHeight: '1.7',
      }}>
        Hi {userName}, we are so glad you are here.
        Mindset is a safe space for your mental health
        journey — whether you are looking for therapy,
        resources, or community support.
      </Text>

      <Section style={{
        backgroundColor: '#f0fdfa',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #99f6e4',
        margin: '0 0 28px',
      }}>
        <Text style={{
          fontSize: '14px',
          fontWeight: '700',
          color: '#0f766e',
          margin: '0 0 16px',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.5px',
        }}>
          Here is what you can do
        </Text>
        {[
          ['🩺', 'Book a Session', 'Connect with our qualified therapists and counselors'],
          ['📚', 'Browse Study Materials', 'Access free and premium mental health resources'],
          ['🏥', 'Join NGO Visits', 'Volunteer for community mental health outreach'],
          ['🛍️', 'Explore Products', 'Wellness products curated for your journey'],
        ].map(([icon, title, desc], i) => (
          <div key={i} style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '12px',
          }}>
            <Text style={{
              fontSize: '20px',
              margin: '0',
              minWidth: '28px',
            }}>
              {icon}
            </Text>
            <div>
              <Text style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#0f172a',
                margin: '0 0 2px',
              }}>
                {title}
              </Text>
              <Text style={{
                fontSize: '13px',
                color: '#64748b',
                margin: '0',
              }}>
                {desc}
              </Text>
            </div>
          </div>
        ))}
      </Section>

      <Section style={{ textAlign: 'center' as const, margin: '0 0 24px' }}>
        <EmailButton
          href={`${APP_BASE_URL}/user`}
        >
          Go to Your Dashboard
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
        &ldquo;You don&apos;t have to control your thoughts.
        You just have to stop letting them control you.&rdquo;
      </Text>
    </EmailLayout>
  )
}
