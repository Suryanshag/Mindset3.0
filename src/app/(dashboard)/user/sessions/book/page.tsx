'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEmailVerifiedSignal } from '@/lib/use-email-verified-signal'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import RazorpayCheckout, {
  type RazorpayResponse,
} from '@/components/payments/razorpay-checkout'
import SlotsCalendar, { type CalendarSlot } from '@/components/ui/slots-calendar'
import { formatSessionDateLong } from '@/lib/format-date'

// TODO: wire to specialization data — filter pills are visual scaffolding only.
const FILTER_PILLS = [
  'All therapists',
  'Anxiety',
  'Depression',
  'Relationships',
  'Student & Academic',
  'Family',
] as const

interface Doctor {
  id: string
  slug: string
  photo: string | null
  designation: string
  type: string
  specialization: string
  qualification: string
  experience: number
  bio: string
  sessionPrice: string
  user: { name: string }
  slots?: CalendarSlot[]
}

export default function BookSessionPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: authSession } = useSession()
  const doctorId = searchParams.get('doctorId')

  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<CalendarSlot | null>(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [activeFilter, setActiveFilter] = useState<(typeof FILTER_PILLS)[number]>('All therapists')
  const [bioExpanded, setBioExpanded] = useState(false)

  // Payment state
  const [paymentData, setPaymentData] = useState<{
    razorpayOrderId: string
    amount: number
    sessionId: string
  } | null>(null)

  // When the user verifies email in another tab, dismiss any stale
  // "verify your email" toast and refresh server state.
  useEmailVerifiedSignal(() => {
    toast.dismiss()
    router.refresh()
  })

  useEffect(() => {
    if (doctorId) {
      fetch(`/api/doctors/lookup?doctorId=${doctorId}`)
        .then((r) => r.json())
        .then((res) => {
          if (res.success) setSelectedDoctor(res.data)
          else toast.error('Doctor not found')
        })
        .finally(() => setLoading(false))
    } else {
      fetch('/api/doctors')
        .then((r) => r.json())
        .then((res) => {
          if (res.success) setDoctors(res.data)
        })
        .finally(() => setLoading(false))
    }
  }, [doctorId])

  async function handleBook() {
    if (!selectedSlot || !selectedDoctor) return
    setBooking(true)

    try {
      // Step 1: Create pending session
      const res = await fetch('/api/user/sessions/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          slotId: selectedSlot.id,
        }),
      })
      const data = await res.json()
      if (!data.success) {
        if (res.status === 403 && /verify your email/i.test(data.error ?? '')) {
          toast.error(
            'Please verify your email to book sessions. Check your inbox for the link — or tap "Send link" in the verify banner.',
            { duration: 8000 }
          )
        } else {
          toast.error(data.error ?? 'Failed to book session')
        }
        setBooking(false)
        return
      }

      const sessionId = data.data.id

      // Step 2: Create Razorpay order
      const payRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'SESSION', sessionId }),
      })
      const payData = await payRes.json()
      if (!payData.success) {
        toast.error(payData.error ?? 'Failed to create payment order')
        setBooking(false)
        return
      }

      // Step 3: Show Razorpay checkout
      setPaymentData({
        razorpayOrderId: payData.data.razorpayOrderId,
        amount: payData.data.amount,
        sessionId,
      })
      setBooking(false)
    } catch {
      toast.error('Something went wrong')
      setBooking(false)
    }
  }

  async function handlePaymentSuccess(response: RazorpayResponse) {
    // Razorpay captured client-side. Synchronously confirm via /api/
    // payments/verify so the Session.status flip happens before we
    // navigate the user to /user/sessions (where they expect to see
    // a CONFIRMED session). Webhook still runs as backup.
    setPaymentData(null)

    try {
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        }),
      })

      if (res.ok) {
        toast.success('Payment successful! Your session is confirmed.')
        setSelectedSlot(null)
        setTimeout(() => router.push('/user/sessions'), 1500)
        return
      }

      // Verify rejected. Most common: signature mismatch or server
      // error. Razorpay charged the card; webhook backup may still
      // land. Tell the user the payment went through and ask them to
      // refresh.
      toast.error(
        'Payment received but confirmation pending. Refresh /user/sessions in a moment, or check your email.'
      )
      setSelectedSlot(null)
      setTimeout(() => router.push('/user/sessions'), 3000)
    } catch {
      toast.error(
        'Network issue while confirming. Your payment was received — check /user/sessions in a moment.'
      )
      setTimeout(() => router.push('/user/sessions'), 3000)
    }
  }

  function handlePaymentDismiss() {
    setPaymentData(null)
    toast.info('Payment cancelled. Your session slot is still reserved for 10 minutes.')
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6 text-text">
          Book a Session
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="w-16 h-16 bg-gray-200 rounded-full mb-3" />
              <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-24 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Show doctor list if no doctorId
  if (!doctorId && !selectedDoctor) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6 text-text">
          Book a Session
        </h1>

        {/* First-time framing — friendly, not overbearing */}
        <section
          className="mx-auto max-w-[720px] rounded-2xl p-5 mb-6"
          style={{
            background: 'var(--color-bg-rail)',
            border: '1px solid var(--color-border-strong)',
          }}
        >
          <h2 className="text-[16px] font-medium text-text">First time booking?</h2>
          <p className="text-[14px] text-text-muted leading-relaxed mt-1.5">
            Here&apos;s what to expect: pick a therapist based on what you need,
            choose a date and time that works, pay via Razorpay, then receive a
            Google Meet link from your therapist before the session.
          </p>
          <p className="text-[13px] text-text-faint mt-2">
            All our therapists are RCI-registered. Sessions are completely
            confidential.
          </p>
        </section>

        {/* Filter pills — visual scaffolding only, no filter logic yet. */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTER_PILLS.map((label) => {
            const active = activeFilter === label
            return (
              <button
                key={label}
                type="button"
                onClick={() => setActiveFilter(label)}
                className={`py-2 px-4 rounded-full text-[13px] font-medium transition-colors ${
                  active
                    ? 'bg-primary text-white'
                    : 'bg-bg-card text-text hover:bg-white/80'
                }`}
                style={
                  active
                    ? undefined
                    : { border: '1px solid var(--color-border-strong)' }
                }
              >
                {label}
              </button>
            )
          })}
        </div>

        {doctors.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-500">
            No doctors available at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
            {doctors.map((doc) => (
              <Link
                key={doc.id}
                href={`/user/sessions/book?doctorId=${doc.id}`}
                className="bg-white rounded-xl shadow-sm p-5 lg:p-6 transition-all duration-150 hover:shadow-md hover:-translate-y-0.5"
                style={{ border: '1px solid var(--color-border-strong)' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-full overflow-hidden bg-gray-100 relative flex-shrink-0">
                    {doc.photo ? (
                      <Image
                        src={doc.photo}
                        alt={doc.user.name}
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 64px, 56px"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-base lg:text-lg font-bold text-white"
                        style={{ background: 'var(--teal)' }}
                      >
                        {doc.user.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[15px]" style={{ color: 'var(--navy)' }}>
                      {doc.user.name}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2">{doc.designation}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold" style={{ color: 'var(--teal)' }}>
                  &#8377;{Number(doc.sessionPrice).toLocaleString('en-IN')} / session
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Show booking form for selected doctor
  const availableSlots = selectedDoctor?.slots ?? []

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-text">
        Book a Session
      </h1>

      {selectedDoctor && (
        <>
          {/* Doctor card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 mb-6">
            <div className="flex items-center gap-4 lg:gap-6">
              <div className="w-20 h-20 lg:w-28 lg:h-28 rounded-full overflow-hidden bg-gray-100 relative flex-shrink-0">
                {selectedDoctor.photo ? (
                  <Image
                    src={selectedDoctor.photo}
                    alt={selectedDoctor.user.name}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 112px, 80px"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-xl lg:text-3xl font-bold text-white"
                    style={{ background: 'var(--teal)' }}
                  >
                    {selectedDoctor.user.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base lg:text-lg truncate text-text">
                  {selectedDoctor.user.name}
                </p>
                <p className="text-sm text-gray-500 truncate">{selectedDoctor.designation}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl lg:text-3xl font-bold text-text">
                  &#8377;{Number(selectedDoctor.sessionPrice).toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-gray-500">per session</p>
              </div>
            </div>
          </div>

          {/* About Dr. X — expandable */}
          <div
            className="bg-bg-card rounded-2xl p-5 mb-6"
            style={{ border: '1px solid var(--color-border)' }}
          >
            <p className="text-[11px] font-medium text-text-faint uppercase tracking-[0.6px] mb-2">
              About {selectedDoctor.user.name}
            </p>
            {(() => {
              const bioText =
                selectedDoctor.bio?.trim() ||
                `${selectedDoctor.user.name} specializes in ${selectedDoctor.specialization}. Detailed bio coming soon.`
              return (
                <>
                  <p
                    className={`text-[14px] text-text leading-relaxed whitespace-pre-wrap ${
                      bioExpanded ? '' : 'line-clamp-2'
                    }`}
                  >
                    {bioText}
                  </p>
                  {bioExpanded && (
                    <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
                      <div>
                        <dt className="text-text-faint">Qualification</dt>
                        <dd className="text-text mt-0.5">{selectedDoctor.qualification}</dd>
                      </div>
                      <div>
                        <dt className="text-text-faint">Experience</dt>
                        <dd className="text-text mt-0.5">
                          {selectedDoctor.experience}{' '}
                          {selectedDoctor.experience === 1 ? 'year' : 'years'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-text-faint">Specialization</dt>
                        <dd className="text-text mt-0.5">{selectedDoctor.specialization}</dd>
                      </div>
                    </dl>
                  )}
                  <button
                    type="button"
                    onClick={() => setBioExpanded((v) => !v)}
                    className="text-[13px] text-primary font-medium mt-3 hover:underline"
                  >
                    {bioExpanded ? 'Show less' : 'Read more →'}
                  </button>
                </>
              )
            })()}
          </div>

          {/* Reassurance line above the calendar */}
          <p className="text-[13px] text-text-muted text-center mb-4">
            Your first session is just a conversation. No pressure to commit to
            anything beyond that.
          </p>

          {/* Razorpay Checkout */}
          {paymentData && authSession?.user && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
              <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--navy)' }}>
                Complete Payment
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Amount: &#8377;{(paymentData.amount / 100).toLocaleString('en-IN')}
              </p>
              <RazorpayCheckout
                orderId={paymentData.razorpayOrderId}
                amount={paymentData.amount}
                name={authSession.user.name ?? ''}
                email={authSession.user.email ?? ''}
                description={`Session with ${selectedDoctor.user.name}`}
                onSuccess={handlePaymentSuccess}
                onDismiss={handlePaymentDismiss}
                buttonText={`Pay \u20B9${(paymentData.amount / 100).toLocaleString('en-IN')}`}
              />
            </div>
          )}

          {/* Available slots calendar */}
          {!paymentData && (
            <>
              {availableSlots.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-500">
                  No available slots at the moment.
                </div>
              ) : (
                <div className="space-y-6">
                  <h2 className="text-lg font-bold" style={{ color: 'var(--navy)' }}>
                    Select a Date & Time
                  </h2>

                  <SlotsCalendar
                    slots={availableSlots}
                    selectedSlotId={selectedSlot?.id ?? null}
                    onSlotSelect={setSelectedSlot}
                    mode="book"
                  />

                  {/* Selected slot confirmation */}
                  {selectedSlot && (
                    <div
                      className="p-5 rounded-2xl border"
                      style={{ background: 'var(--teal)10', borderColor: 'var(--teal)30' }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--teal)' }}>
                            Selected slot
                          </p>
                          <p className="text-lg font-bold mt-0.5" style={{ color: 'var(--navy)' }}>
                            {formatSessionDateLong(selectedSlot.date)}
                          </p>
                        </div>
                        <button
                          onClick={handleBook}
                          disabled={booking}
                          className="w-full sm:w-auto sm:max-w-sm flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 sm:flex-shrink-0"
                          style={{ background: 'var(--teal)' }}
                        >
                          {booking
                            ? 'Booking...'
                            : `Book & Pay \u20B9${Number(selectedDoctor.sessionPrice).toLocaleString('en-IN')}`}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
