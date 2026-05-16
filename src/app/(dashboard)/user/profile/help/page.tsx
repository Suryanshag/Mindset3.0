import { Mail, MessageCircle, AlertTriangle, ChevronRight } from 'lucide-react'
import PageHeader from '@/components/dashboard/page-header'
import { SUPPORT_EMAIL, WHATSAPP_GROUP_URL } from '@/lib/constants/contact'

const items = [
  {
    title: 'Email us',
    description: 'Ask a question or share feedback',
    href: `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Question about Mindset')}`,
    Icon: Mail,
    tint: 'bg-primary-tint',
    iconColor: 'text-primary',
  },
  {
    title: 'Join our community',
    description: 'Connect with others on WhatsApp',
    href: WHATSAPP_GROUP_URL,
    Icon: MessageCircle,
    tint: 'bg-green-50',
    iconColor: 'text-green-600',
  },
  {
    title: 'Report a technical issue',
    description: 'Something broken? Let us know',
    href: `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Technical issue')}&body=${encodeURIComponent('Please describe the issue below:\n\n---\nDevice / Browser info will be attached by your email client.')}`,
    Icon: AlertTriangle,
    tint: 'bg-accent-tint',
    iconColor: 'text-accent',
  },
]

export default function HelpPage() {
  return (
    <div>
      <PageHeader title="Help & support" back="/user/profile" />

      <div className="pt-5">
        <div
          className="bg-bg-card rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--color-border)' }}
        >
          {items.map((item, i) => (
            <a
              key={item.title}
              href={item.href}
              target={item.href.startsWith('mailto:') ? undefined : '_blank'}
              rel={item.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
              className="flex items-center gap-3.5 px-4 py-3.5 lg:py-4 transition-colors duration-150 lg:hover:bg-white/60"
              style={
                i < items.length - 1
                  ? { borderBottom: '1px solid var(--color-border)' }
                  : undefined
              }
            >
              <div className={`w-10 h-10 rounded-xl ${item.tint} flex items-center justify-center shrink-0`}>
                <item.Icon size={18} className={item.iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-text">{item.title}</p>
                <p className="text-[12px] text-text-muted mt-0.5">{item.description}</p>
              </div>
              <ChevronRight size={16} className="text-text-faint shrink-0" />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
