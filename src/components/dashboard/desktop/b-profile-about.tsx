import Image from 'next/image'
import Link from 'next/link'
import { BCap, BCard } from './b-atoms'
import BPageHeader from './b-page-header'
import { SUPPORT_EMAIL, WHATSAPP_GROUP_URL } from '@/lib/constants/contact'

// Phase 3j — About Mindset (Direction B port).

export default function BProfileAbout() {
  return (
    <>
      <BPageHeader
        title="About Mindset."
        breadcrumb={[
          { label: 'PROFILE', href: '/user/profile' },
          { label: 'ABOUT' },
        ]}
        back="/user/profile"
        sub="Why we built this, and what it isn&rsquo;t."
        ctas={['search']}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 28 }}>
        {/* Manifesto */}
        <BCard padding={32}>
          <BCap>Why we built this</BCap>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 20,
              lineHeight: 1.4,
              marginTop: 16,
              color: 'var(--text)',
            }}
          >
            Most of us grew up watching our parents do everything for their{' '}
            <span style={{ fontStyle: 'italic' }}>maan</span> except this:
            name it, sit with it, hand it to a stranger and pay them by the hour.
          </p>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 15,
              color: 'var(--text-muted)',
              marginTop: 18,
              lineHeight: 1.75,
            }}
          >
            We started Mindset because we wanted the last part to feel less
            foreign. Not as a copy of an American clinic — as a quieter, slower
            thing that fits the way we&rsquo;d actually want someone to talk
            to us.
          </p>
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 24, paddingTop: 18 }}>
            <BCap>What we don&rsquo;t do</BCap>
            <div
              style={{
                marginTop: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                fontFamily: 'var(--font-serif)',
                fontSize: 14,
                color: 'var(--text)',
                lineHeight: 1.6,
              }}
            >
              <div>— No streaks, no badges, no level-ups.</div>
              <div>— No push notifications about your therapy.</div>
              <div>— No selling your data. There is no exit where we do this.</div>
              <div>— No mascot.</div>
            </div>
          </div>
        </BCard>

        {/* Contact + brand */}
        <div className="flex flex-col gap-3.5">
          <BCard padding={20} style={{ textAlign: 'center' }}>
            <Image
              src="/images/icons/Logo.webp"
              alt="Mindset"
              width={56}
              height={56}
              className="mx-auto rounded-xl object-cover"
            />
            <p
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 18,
                fontWeight: 500,
                marginTop: 12,
                color: 'var(--text)',
              }}
            >
              Mindset
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Made in India
            </p>
            <Link
              href="/"
              style={{
                display: 'inline-block',
                fontFamily: 'var(--font-heading)',
                fontSize: 12,
                color: 'var(--primary)',
                marginTop: 12,
              }}
            >
              View public site ›
            </Link>
          </BCard>

          <BCard padding={16}>
            <BCap>Get in touch</BCap>
            <div className="flex flex-col gap-2 mt-3 text-[13px]">
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 13,
                  color: 'var(--text)',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                }}
              >
                {SUPPORT_EMAIL}
              </a>
              <a
                href={WHATSAPP_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 13,
                  color: 'var(--text)',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                }}
              >
                WhatsApp community ›
              </a>
            </div>
          </BCard>

          <BCard accent="var(--accent)" padding={14}>
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: 13.5,
                color: 'var(--text)',
                lineHeight: 1.6,
              }}
            >
              If you have feedback — especially negative — write to the
              founders directly.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10.5,
                color: 'var(--accent-deep)',
                marginTop: 8,
                letterSpacing: '0.04em',
              }}
            >
              {SUPPORT_EMAIL.toUpperCase()}
            </p>
          </BCard>
        </div>
      </div>
    </>
  )
}
