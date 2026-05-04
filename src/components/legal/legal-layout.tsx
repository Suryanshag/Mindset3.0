import type { ReactNode } from 'react'
import Navbar from '@/components/Navbar'

export function LegalLayout({
  title,
  effectiveDate,
  children,
}: {
  title: string
  effectiveDate: string
  children: ReactNode
}) {
  return (
    <main>
      <Navbar />
      <section
        className="section-padding"
        style={{ background: 'linear-gradient(180deg, var(--cream) 0%, var(--background) 100%)' }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p
            className="font-heading text-sm tracking-[0.3em] uppercase mb-5"
            style={{ color: 'var(--coral)' }}
          >
            Legal
          </p>
          <h1
            className="font-heading text-4xl md:text-6xl font-bold leading-tight mb-4"
            style={{ color: 'var(--navy)' }}
          >
            {title}
          </h1>
          <p style={{ color: 'var(--navy)', opacity: 0.7 }}>
            Effective {effectiveDate}
          </p>
        </div>
      </section>

      <section className="section-padding" style={{ background: 'var(--background)' }}>
        <div
          className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 legal-prose"
          style={{ color: 'var(--navy)' }}
        >
          {children}
        </div>
      </section>

      <style>{`
        .legal-prose h2 {
          font-family: var(--font-heading);
          font-size: 1.75rem;
          font-weight: 700;
          margin-top: 2.75rem;
          margin-bottom: 1rem;
          color: var(--navy);
        }
        .legal-prose h3 {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.75rem;
          margin-bottom: 0.6rem;
          color: var(--navy);
        }
        .legal-prose p,
        .legal-prose li {
          font-size: 1rem;
          line-height: 1.75;
          opacity: 0.92;
        }
        .legal-prose p { margin-bottom: 1rem; }
        .legal-prose ul {
          list-style: disc;
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .legal-prose li { margin-bottom: 0.4rem; }
        .legal-prose a {
          color: var(--teal);
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .legal-prose strong { color: var(--navy); font-weight: 600; }
        .legal-prose .callout {
          border-left: 3px solid var(--coral);
          background: rgba(249, 101, 83, 0.06);
          padding: 1rem 1.25rem;
          border-radius: 0 8px 8px 0;
          margin: 1.5rem 0;
        }
      `}</style>
    </main>
  )
}
