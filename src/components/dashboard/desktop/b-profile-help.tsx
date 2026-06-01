import Link from 'next/link'
import { BCap, BCard } from './b-atoms'
import BPageHeader from './b-page-header'
import { SUPPORT_EMAIL, WHATSAPP_GROUP_URL } from '@/lib/constants/contact'

// Phase 3j — Help & support (Direction B port).
// FAQ + contact rail + crisis pointer.

const FAQS = [
  {
    cat: 'Sessions',
    qs: [
      {
        q: 'How long are sessions?',
        a: '50 minutes for the work, 10 minutes for notes. You pay for 50.',
      },
      {
        q: 'Can I reschedule?',
        a: 'Once for free, up to 24 hours before. After that, half-fee.',
      },
      {
        q: "What if my therapist isn't a fit?",
        a: 'First change is free. Tell us why if you can — we use that to improve intake.',
      },
    ],
  },
  {
    cat: 'Privacy',
    qs: [
      {
        q: 'Who can read my journal?',
        a: "Only you, unless you explicitly share an entry. Your therapist sees what you share. No one else, ever.",
      },
      {
        q: 'Where is my data stored?',
        a: 'Encrypted at rest and in transit. Deleted within 30 days if you delete your account.',
      },
      {
        q: 'Do you sell data?',
        a: "No. We aren't building toward that.",
      },
    ],
  },
  {
    cat: 'Money',
    qs: [
      {
        q: "Why don't you have a subscription?",
        a: "We didn't want you to pay for therapy you didn't use. You pay per session.",
      },
      {
        q: 'Can I get a refund?',
        a: 'Sessions: up to 24 h before, full. Shop: 7 days, unused. Workshops: up to start time.',
      },
    ],
  },
]

export default function BProfileHelp() {
  return (
    <>
      <BPageHeader
        title="Help."
        breadcrumb={[
          { label: 'PROFILE', href: '/user/profile' },
          { label: 'HELP & SUPPORT' },
        ]}
        back="/user/profile"
        sub="Most answers are here. If they aren&rsquo;t, a person reads everything you send."
        ctas={['search']}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24 }}>
        {/* FAQ */}
        <div className="flex flex-col gap-4">
          {FAQS.map((f, fi) => (
            <BCard key={fi} padding={0} style={{ overflow: 'hidden' }}>
              <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                <BCap>{f.cat}</BCap>
              </div>
              {f.qs.map((q, j) => (
                <div
                  key={j}
                  style={{
                    padding: '14px 20px',
                    borderTop: j === 0 ? 'none' : '1px solid var(--border)',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 14,
                      fontWeight: 500,
                      color: 'var(--text)',
                    }}
                  >
                    {q.q}
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 13.5,
                      color: 'var(--text-muted)',
                      marginTop: 4,
                      lineHeight: 1.6,
                    }}
                  >
                    {q.a}
                  </p>
                </div>
              ))}
            </BCard>
          ))}
        </div>

        {/* Contact rail */}
        <div className="flex flex-col gap-3.5">
          <BCard padding={16}>
            <BCap>Talk to a person</BCap>
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 14,
                color: 'var(--text)',
                marginTop: 10,
                lineHeight: 1.55,
              }}
            >
              Two of us read every message. Usually back in a day. Sometimes
              the same hour.
            </p>
            <div className="flex flex-col gap-2 mt-3">
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Question about Mindset')}`}
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 13,
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'var(--primary)',
                  color: '#fff',
                  textAlign: 'left',
                  fontWeight: 500,
                }}
              >
                Email us ›
              </a>
              <a
                href={WHATSAPP_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 13,
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'transparent',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  textAlign: 'left',
                }}
              >
                WhatsApp community ›
              </a>
            </div>
          </BCard>

          <BCard accent="var(--accent)" padding={16}>
            <BCap style={{ color: 'var(--accent-deep)' }}>If today is heavy</BCap>
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 13,
                color: 'var(--text)',
                marginTop: 8,
                lineHeight: 1.55,
              }}
            >
              Mindset isn&rsquo;t a crisis line. If you need one tonight:
            </p>
            <div
              style={{
                fontSize: 12.5,
                color: 'var(--text)',
                marginTop: 8,
                lineHeight: 1.7,
              }}
            >
              iCall · <a href="tel:9152987821" style={{ textDecoration: 'underline' }}>9152987821</a>
              <br />
              Vandrevala · <a href="tel:18602662345" style={{ textDecoration: 'underline' }}>1860-266-2345</a>
              <br />
              KIRAN · <a href="tel:18005990019" style={{ textDecoration: 'underline' }}>1800-599-0019</a>
            </div>
            <Link
              href="/user/sos"
              style={{
                display: 'inline-block',
                fontFamily: 'var(--font-heading)',
                fontSize: 12,
                color: 'var(--primary)',
                marginTop: 10,
              }}
            >
              Open SOS room ›
            </Link>
          </BCard>
        </div>
      </div>
    </>
  )
}
