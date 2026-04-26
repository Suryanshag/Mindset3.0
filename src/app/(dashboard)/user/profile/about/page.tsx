import Link from 'next/link'
import { Mail, MessageCircle, ExternalLink } from 'lucide-react'
import PageHeader from '@/components/dashboard/page-header'
import { SUPPORT_EMAIL, WHATSAPP_GROUP_URL } from '@/lib/constants/contact'

export default function AboutPage() {
  return (
    <div>
      <PageHeader title="About" back="/user/profile" />

      <div className="space-y-5 pt-5">
        {/* Logo + wordmark */}
        <div className="flex flex-col items-center">
          <img
            src="/images/Logo.jpg"
            alt="Mindset"
            className="w-16 h-16 rounded-2xl object-cover"
          />
          <p className="text-[20px] font-medium text-text mt-3">Mindset</p>
        </div>

        {/* About copy */}
        <div
          className="bg-bg-card rounded-2xl p-4"
          style={{ border: '0.5px solid var(--color-border)' }}
        >
          <p className="text-[14px] text-text leading-relaxed">
            Mindset bridges the gap between those who need support and qualified
            mental health professionals. We combine professional therapy sessions
            with community outreach, educational resources, and wellness products
            to create a holistic approach to mental health.
          </p>
          <p className="text-[14px] text-text-muted leading-relaxed mt-3">
            We believe everyone deserves access to quality mental health care —
            accessible, affordable, and stigma-free.
          </p>
        </div>

        {/* Contact links */}
        <div
          className="bg-bg-card rounded-2xl overflow-hidden"
          style={{ border: '0.5px solid var(--color-border)' }}
        >
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="flex items-center gap-3 px-4 py-3.5"
            style={{ borderBottom: '0.5px solid var(--color-border)' }}
          >
            <Mail size={16} className="text-text-faint shrink-0" />
            <span className="text-[13px] text-text-muted">{SUPPORT_EMAIL}</span>
          </a>
          <a
            href={WHATSAPP_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3.5"
          >
            <MessageCircle size={16} className="text-text-faint shrink-0" />
            <span className="text-[13px] text-text-muted">WhatsApp community</span>
          </a>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-3 pt-2 pb-4">
          <p className="text-[12px] text-text-faint">Made by Mindset</p>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[12px] text-primary font-medium"
          >
            <ExternalLink size={12} />
            View public site
          </Link>
        </div>
      </div>
    </div>
  )
}
