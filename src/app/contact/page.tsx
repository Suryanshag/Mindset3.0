import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import { ContactForm } from '@/components/contact/contact-form'

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    "Send us a message and we'll respond within 24 hours. For immediate peer support, join our WhatsApp community.",
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact Mindset',
    description: 'Questions, partnerships, or just want to talk? Reach out — we read every message.',
  },
}

export default function ContactPage() {
  return (
    <main>
      <Navbar />
      <section
        className="section-padding"
        style={{ background: 'linear-gradient(180deg, var(--cream) 0%, var(--background) 100%)' }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p
            className="font-heading text-sm tracking-[0.3em] uppercase mb-5"
            style={{ color: 'var(--coral)' }}
          >
            Get in touch
          </p>
          <h1
            className="font-heading text-4xl md:text-6xl font-bold leading-tight mb-5"
            style={{ color: 'var(--navy)' }}
          >
            We&apos;re here for you.
          </h1>
          <p
            className="text-lg max-w-2xl leading-relaxed"
            style={{ color: 'var(--navy)', opacity: 0.8 }}
          >
            Have questions about our services, want to book a session, or just need to talk?
            Send us a message and our team will get back to you within 24 hours. No judgment —
            just genuine support.
          </p>
        </div>
      </section>

      <section className="section-padding" style={{ background: 'var(--background)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16">
            <aside className="lg:col-span-2 space-y-8">
              <div>
                <h3
                  className="font-heading text-xl font-bold mb-3"
                  style={{ color: 'var(--navy)' }}
                >
                  Email us
                </h3>
                <a
                  href="mailto:mindset.org.connect@gmail.com"
                  className="text-base"
                  style={{ color: 'var(--teal)' }}
                >
                  mindset.org.connect@gmail.com
                </a>
                <p className="text-sm mt-2" style={{ color: 'var(--navy)', opacity: 0.65 }}>
                  We typically reply within one working day.
                </p>
              </div>

              <div>
                <h3
                  className="font-heading text-xl font-bold mb-3"
                  style={{ color: 'var(--navy)' }}
                >
                  Hours
                </h3>
                <p style={{ color: 'var(--navy)', opacity: 0.85 }}>
                  Monday – Saturday<br />
                  9:00 AM – 7:00 PM IST
                </p>
              </div>

              <div
                className="rounded-2xl p-5"
                style={{
                  background: 'rgba(249, 101, 83, 0.08)',
                  borderLeft: '3px solid var(--coral)',
                }}
              >
                <h3
                  className="font-heading text-base font-bold mb-2"
                  style={{ color: 'var(--navy)' }}
                >
                  In crisis?
                </h3>
                <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--navy)' }}>
                  This form isn&apos;t monitored 24×7. For immediate peer support, join our WhatsApp community:
                </p>
                <a
                  href="https://chat.whatsapp.com/DI8Q35DhYkl2xme5ZyTm2K"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium"
                  style={{ color: 'var(--teal)' }}
                >
                  Join WhatsApp group
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 17L17 7M9 7h8v8" />
                  </svg>
                </a>
              </div>
            </aside>

            <div className="lg:col-span-3">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
