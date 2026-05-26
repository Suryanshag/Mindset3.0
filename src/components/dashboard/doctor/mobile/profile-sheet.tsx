'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Info, LogOut } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default function ProfileSheet({ open, onClose }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const name = session?.user?.name ?? 'Doctor'

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  if (!open) return null

  async function handleSignOut() {
    await signOut({ redirect: false })
    router.replace('/login')
  }

  return (
    <div className="lg:hidden fixed inset-0 z-[60] flex items-end">
      <div
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: 'rgba(20,30,28,0.45)', backdropFilter: 'blur(4px)' }}
      />
      <div
        className="relative w-full overflow-y-auto"
        style={{
          background: 'var(--bg-card)',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: '14px 16px max(22px, env(safe-area-inset-bottom))',
          maxHeight: '85vh',
          animation: 'sheetUp .3s cubic-bezier(.2,.8,.2,1)',
        }}
      >
        {/* Drag handle */}
        <div
          className="mx-auto mb-4 rounded"
          style={{ width: 40, height: 4, background: 'rgba(0,0,0,0.18)' }}
        />

        {/* Doctor header */}
        <div className="flex items-center gap-3.5 px-1 pb-3.5">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-[16px] font-extrabold"
            style={{ background: 'var(--accent)', color: 'var(--on-dark, var(--cream))' }}
          >
            {getInitials(name)}
          </div>
          <div className="min-w-0">
            <div className="text-[17px] font-extrabold truncate" style={{ color: 'var(--text)' }}>
              {name}
            </div>
            <div className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Doctor
            </div>
          </div>
        </div>

        {/* "More on desktop" info — static, not tappable */}
        <div
          className="rounded-[18px] p-4 flex items-start gap-3"
          style={{ background: 'var(--bg-app)' }}
        >
          <div
            className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
            style={{ background: 'var(--bg-card)', color: 'var(--primary)' }}
          >
            <Info size={16} strokeWidth={1.8} />
          </div>
          <div className="flex-1">
            <div className="text-[14px] font-extrabold" style={{ color: 'var(--text)' }}>
              More on desktop
            </div>
            <p
              className="text-[12.5px] mt-1 leading-[1.5]"
              style={{ color: 'var(--text-muted)' }}
            >
              Slots, earnings, payouts, profile editing, and leave management
              are designed for larger screens. Open{' '}
              <span className="font-bold">mindset.org.in/doctor</span> on your laptop.
            </p>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full mt-4 inline-flex items-center justify-center gap-2 rounded-full text-[14px] font-extrabold"
          style={{
            padding: 14,
            background: 'transparent',
            color: 'var(--accent-deep)',
            border: '1.5px solid var(--border-strong)',
          }}
        >
          <LogOut size={14} strokeWidth={2.2} /> Sign out
        </button>
      </div>
    </div>
  )
}
