'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registerForNgoVisit } from '@/lib/actions/ngo'

export default function NgoRegisterButton({ ngoVisitId }: { ngoVisitId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [incompleteFields, setIncompleteFields] = useState<string[] | null>(null)

  function handleRegister() {
    setError(null)
    setIncompleteFields(null)
    startTransition(async () => {
      const res = await registerForNgoVisit(ngoVisitId)
      if ('success' in res) {
        router.refresh()
        return
      }
      if (res.error === 'INCOMPLETE_PROFILE' && 'missing' in res) {
        setIncompleteFields(res.missing)
        return
      }
      setError(res.error)
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={handleRegister}
        disabled={isPending}
        className="w-full px-4 py-3.5 rounded-xl text-white font-medium text-[15px] disabled:opacity-60"
        style={{ background: 'var(--color-accent)' }}
      >
        {isPending ? 'Registering…' : 'Register for this visit'}
      </button>
      {error && (
        <p className="text-[13px] text-red-600 mt-2 text-center">{error}</p>
      )}

      {incompleteFields && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(30, 68, 92, 0.45)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIncompleteFields(null)
          }}
        >
          <div className="w-full max-w-[420px] bg-bg-card rounded-2xl p-6">
            <h3 className="text-[18px] font-medium text-text mb-2">
              Complete your profile to register
            </h3>
            <p className="text-[13px] text-text-muted mb-4">
              We need a bit more information before we can register you for this NGO visit.
            </p>
            <p className="text-[12px] font-medium text-text-faint uppercase tracking-wider mb-1.5">
              Missing
            </p>
            <ul className="space-y-1 mb-5">
              {incompleteFields.map((f) => (
                <li key={f} className="text-[14px] text-text capitalize">
                  • {f}
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIncompleteFields(null)}
                className="text-[13px] font-medium text-text-muted"
              >
                Cancel
              </button>
              <Link
                href="/user/profile"
                className="text-[13px] font-medium px-4 py-2.5 rounded-lg text-white"
                style={{ background: 'var(--color-accent)' }}
              >
                Update profile
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
