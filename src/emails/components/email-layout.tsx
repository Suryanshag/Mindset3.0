import {
  Body, Container, Head, Html, Preview,
  Section, Text, Link,
} from '@react-email/components'
import { CSSProperties } from 'react'

interface EmailLayoutProps {
  preview: string
  children: React.ReactNode
}

const styles = {
  main: {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  } as CSSProperties,
  container: {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '0',
    maxWidth: '600px',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  } as CSSProperties,
  header: {
    backgroundColor: '#0f172a',
    padding: '28px 40px',
    textAlign: 'center' as const,
  },
  headerLogo: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#14b8a6',
    letterSpacing: '-0.5px',
    margin: '0',
  },
  headerTagline: {
    fontSize: '12px',
    color: '#94a3b8',
    margin: '4px 0 0',
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
  },
  content: {
    padding: '40px 40px 32px',
  },
  footer: {
    backgroundColor: '#f8fafc',
    borderTop: '1px solid #e2e8f0',
    padding: '24px 40px',
    textAlign: 'center' as const,
  },
  footerText: {
    fontSize: '12px',
    color: '#94a3b8',
    margin: '4px 0',
    lineHeight: '1.6',
  },
  footerLink: {
    color: '#14b8a6',
    textDecoration: 'none',
  },
}

export default function EmailLayout({
  preview,
  children
}: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Text style={styles.headerLogo}>Mindset</Text>
            <Text style={styles.headerTagline}>
              Mental Health & Wellness
            </Text>
          </Section>

          {/* Content */}
          <Section style={styles.content}>
            {children}
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              This email was sent by Mindset Mental Health Platform
            </Text>
            <Text style={styles.footerText}>
              If you have questions, contact us at{' '}
              <Link
                href="mailto:support@mindset.com"
                style={styles.footerLink}
              >
                support@mindset.com
              </Link>
            </Text>
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} Mindset.
              All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
