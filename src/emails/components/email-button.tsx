import { Button } from '@react-email/components'
import { CSSProperties } from 'react'

interface EmailButtonProps {
  href: string
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
}

export default function EmailButton({
  href,
  children,
  variant = 'primary'
}: EmailButtonProps) {
  const style: CSSProperties = variant === 'primary' ? {
    backgroundColor: '#14b8a6',
    color: '#ffffff',
    padding: '14px 32px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '15px',
    textDecoration: 'none',
    display: 'inline-block',
  } : {
    backgroundColor: '#ffffff',
    color: '#14b8a6',
    padding: '12px 28px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '15px',
    border: '2px solid #14b8a6',
    textDecoration: 'none',
    display: 'inline-block',
  }

  return <Button href={href} style={style}>{children}</Button>
}
