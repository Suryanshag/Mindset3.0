'use client'

// Phase 6 — Mobile Language screen. Visual port of flows.jsx
// SettingsLanguage (lines 361-390). i18n itself is out of scope this
// phase, so the selection persists only for the screen's lifetime.

import { useState } from 'react'
import { Card } from './ui'
import SettingsShell from './settings-shell'

const LANGS = [
  { id: 'en', label: 'English', sub: 'Default' },
  { id: 'hi', label: 'हिंदी', sub: 'Hindi' },
  { id: 'mr', label: 'मराठी', sub: 'Marathi' },
  { id: 'ta', label: 'தமிழ்', sub: 'Tamil' },
  { id: 'te', label: 'తెలుగు', sub: 'Telugu' },
  { id: 'bn', label: 'বাংলা', sub: 'Bengali' },
] as const

export default function MobileSettingsLanguage() {
  const [lang, setLang] = useState<string>('en')

  return (
    <SettingsShell title="Language">
      <Card
        padding={14}
        bg="var(--primary-tint)"
        radius={16}
        style={{ marginBottom: 16 }}
      >
        <div
          style={{
            fontSize: 12.5,
            color: 'var(--text)',
            lineHeight: 1.5,
            opacity: 0.85,
          }}
        >
          Other languages are coming soon. Mindset is available in English for
          now &mdash; tap any option to preview.
        </div>
      </Card>

      <Card padding={0}>
        {LANGS.map((x, i) => (
          <button
            key={x.id}
            onClick={() => setLang(x.id)}
            type="button"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 16px',
              background: 'transparent',
              borderBottom:
                i === LANGS.length - 1 ? 'none' : '1px solid var(--border)',
              textAlign: 'left',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="ms-display" style={{ fontSize: 18, color: 'var(--text)' }}>
                {x.label}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {x.sub}
              </div>
            </div>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                border:
                  lang === x.id
                    ? '6px solid var(--primary)'
                    : '2px solid var(--border-strong)',
                flexShrink: 0,
              }}
            />
          </button>
        ))}
      </Card>
    </SettingsShell>
  )
}
