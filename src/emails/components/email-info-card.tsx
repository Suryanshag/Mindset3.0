import { Section, Text } from '@react-email/components'
import { CSSProperties } from 'react'

interface InfoCardProps {
  items: { label: string; value: string }[]
  accentColor?: string
}

export default function EmailInfoCard({
  items,
  accentColor = '#14b8a6'
}: InfoCardProps) {
  const cardStyle: CSSProperties = {
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    padding: '20px 24px',
    border: '1px solid #e2e8f0',
    borderLeft: `4px solid ${accentColor}`,
    margin: '24px 0',
  }

  const labelStyle: CSSProperties = {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: '0 0 2px',
  }

  const valueStyle: CSSProperties = {
    fontSize: '15px',
    color: '#1e293b',
    fontWeight: '500',
    margin: '0 0 12px',
  }

  return (
    <Section style={cardStyle}>
      {items.map(({ label, value }, i) => (
        <div key={i}>
          <Text style={labelStyle}>{label}</Text>
          <Text style={valueStyle}>{value}</Text>
        </div>
      ))}
    </Section>
  )
}
