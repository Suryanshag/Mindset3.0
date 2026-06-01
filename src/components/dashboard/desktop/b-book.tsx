'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { toast } from 'sonner'
import RazorpayCheckout, {
  type RazorpayResponse,
} from '@/components/payments/razorpay-checkout'
import SlotsCalendar, { type CalendarSlot } from '@/components/ui/slots-calendar'
import { formatSessionDateLong } from '@/lib/format-date'
import { useEmailVerifiedSignal } from '@/lib/use-email-verified-signal'
import { BCap, BCard, BChip } from './b-atoms'
import BPageHeader from './b-page-header'
import BBookStepper from './b-book-stepper'

// Phase 3c — Desktop B port of the booking flow. State machine and API
// calls are lifted verbatim from the legacy `book/page.tsx`; only the
// chrome and per-step JSX change. The existing SlotsCalendar component
// drives slot picking inside the new card frame.

type Doctor = {
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

type Step = 0 | 1 | 2

export default function BBook() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: authSession } = useSession()
  const doctorId = searchParams.get('doctorId')

  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<CalendarSlot | null>(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [paymentData, setPaymentData] = useState<{
    razorpayOrderId: string
    amount: number
    sessionId: string
  } | null>(null)
  // Step state. 0 = pick therapist, 1 = pick slot, 2 = review + pay.
  // We compute it from selections to stay consistent with URL params:
  // doctorId in URL → start at step 1.
  const [step, setStep] = useState<Step>(0)

  useEmailVerifiedSignal(() => {
    toast.dismiss()
    router.refresh()
  })

  useEffect(() => {
    if (doctorId) {
      fetch(`/api/doctors/lookup?doctorId=${doctorId}`)
        .then((r) => r.json())
        .then((res) => {
          if (res.success) {
            setSelectedDoctor(res.data)
            setStep(1)
          } else {
            toast.error('Doctor not found')
          }
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

  function pickDoctor(d: Doctor) {
    setSelectedDoctor(d)
    setStep(1)
  }

  function continueToReview() {
    if (!selectedSlot) return
    setStep(2)
  }

  function backToSlots() {
    setStep(1)
  }

  function backToTherapists() {
    setSelectedDoctor(null)
    setSelectedSlot(null)
    setStep(0)
    router.replace('/user/sessions/book')
  }

  async function handleBook() {
    if (!selectedSlot || !selectedDoctor) return
    setBooking(true)
    try {
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
            'Please verify your email to book sessions. Check your inbox for the link.',
            { duration: 8000 },
          )
        } else {
          toast.error(data.error ?? 'Failed to book session')
        }
        setBooking(false)
        return
      }
      const sessionId = data.data.id
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
      toast.error(
        'Payment received but confirmation pending. Refresh /user/sessions in a moment, or check your email.',
      )
      setSelectedSlot(null)
      setTimeout(() => router.push('/user/sessions'), 3000)
    } catch {
      toast.error(
        'Network issue while confirming. Your payment was received — check /user/sessions in a moment.',
      )
      setTimeout(() => router.push('/user/sessions'), 3000)
    }
  }

  function handlePaymentDismiss() {
    setPaymentData(null)
    toast.info('Payment cancelled. Your session slot is still reserved for 10 minutes.')
  }

  // ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <BPageHeader title="Loading…" ctas={['search']} />
        <div
          style={{
            padding: '24px',
            background: 'var(--bg-card)',
            borderRadius: 14,
            border: '1px solid var(--border)',
          }}
        >
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Fetching therapists.
          </p>
        </div>
      </>
    )
  }

  if (step === 0) {
    return (
      <Step1
        doctors={doctors}
        onPick={pickDoctor}
      />
    )
  }

  if (step === 1 && selectedDoctor) {
    return (
      <Step2
        doctor={selectedDoctor}
        selectedSlot={selectedSlot}
        onSlotSelect={setSelectedSlot}
        onBack={backToTherapists}
        onContinue={continueToReview}
      />
    )
  }

  if (step === 2 && selectedDoctor && selectedSlot) {
    return (
      <Step3
        doctor={selectedDoctor}
        slot={selectedSlot}
        booking={booking}
        paymentData={paymentData}
        authSessionUser={authSession?.user ?? null}
        onBack={backToSlots}
        onBook={handleBook}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentDismiss={handlePaymentDismiss}
      />
    )
  }

  return null
}

// ─── STEP 1 — Pick a therapist ─────────────────────────────────────

function Step1({
  doctors,
  onPick,
}: {
  doctors: Doctor[]
  onPick: (d: Doctor) => void
}) {
  return (
    <>
      <BPageHeader
        title="Pick someone to work with."
        breadcrumb={[
          { label: 'SESSIONS', href: '/user/sessions' },
          { label: 'BOOK' },
          { label: 'STEP 1 OF 3' },
        ]}
        back="/user/sessions"
        sub={
          doctors.length
            ? `${doctors.length} verified therapists. You can change later.`
            : 'Therapists, ranked by fit.'
        }
        ctas={['search']}
      />
      <BBookStepper at={0} />

      {doctors.length === 0 ? (
        <BCard style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            No therapists available at the moment.
          </p>
        </BCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {doctors.map((d) => (
            <TherapistRow key={d.id} doctor={d} onPick={onPick} />
          ))}
        </div>
      )}
    </>
  )
}

function TherapistRow({
  doctor,
  onPick,
}: {
  doctor: Doctor
  onPick: (d: Doctor) => void
}) {
  const price = Math.round(Number(doctor.sessionPrice))
  const focusTags = (doctor.specialization ?? '')
    .split(/[·,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4)

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: 14,
        border: '1px solid var(--border)',
        padding: '16px 20px',
        display: 'grid',
        gridTemplateColumns: '76px 1.6fr 1fr 130px',
        gap: 18,
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        {doctor.photo ? (
          <Image
            src={doctor.photo}
            alt={doctor.user.name}
            width={56}
            height={56}
            className="rounded-full object-cover"
            style={{ border: '1px solid var(--border)' }}
          />
        ) : (
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background:
                'linear-gradient(160deg, var(--accent-tint), var(--accent))',
              border: '1px solid var(--border)',
            }}
          />
        )}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-faint)' }}>
          {doctor.experience} yrs
        </span>
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 17,
              fontWeight: 500,
              color: 'var(--text)',
            }}
          >
            {doctor.user.name}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
          {doctor.designation}
        </div>
        {doctor.bio && (
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 13.5,
              color: 'var(--text)',
              marginTop: 8,
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            &ldquo;{doctor.bio}&rdquo;
          </div>
        )}
        {focusTags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
            {focusTags.map((f) => (
              <span
                key={f}
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 10.5,
                  padding: '3px 8px',
                  borderRadius: 999,
                  background: 'var(--bg-paper)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.04em',
                }}
              >
                {f}
              </span>
            ))}
          </div>
        )}
      </div>
      <div>
        <BCap>Specialisation</BCap>
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 16,
            color: 'var(--text)',
            marginTop: 4,
          }}
        >
          {doctor.type === 'COUNSELOR' ? 'Counsellor' : 'Psychologist'}
        </div>
        {doctor.qualification && (
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>
            {doctor.qualification}
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right' }}>
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 18,
            fontWeight: 500,
            color: 'var(--text)',
          }}
        >
          ₹{price.toLocaleString('en-IN')}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
          per 50-min session
        </div>
        <button
          type="button"
          onClick={() => onPick(doctor)}
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 12.5,
            padding: '8px 14px',
            borderRadius: 999,
            background: 'var(--primary)',
            color: '#fff',
            border: 'none',
            marginTop: 10,
            fontWeight: 500,
          }}
        >
          Pick ›
        </button>
      </div>
    </div>
  )
}

// ─── STEP 2 — Pick a slot ──────────────────────────────────────────

function Step2({
  doctor,
  selectedSlot,
  onSlotSelect,
  onBack,
  onContinue,
}: {
  doctor: Doctor
  selectedSlot: CalendarSlot | null
  onSlotSelect: (s: CalendarSlot) => void
  onBack: () => void
  onContinue: () => void
}) {
  const slots = doctor.slots ?? []
  return (
    <>
      <BPageHeader
        title="Pick a time, IST."
        breadcrumb={[
          { label: 'SESSIONS', href: '/user/sessions' },
          { label: 'BOOK' },
          { label: 'STEP 2 OF 3' },
        ]}
        sub={`${doctor.user.name} · 50-minute session · ${slots.length} slots available`}
        ctas={['search']}
      />
      <BBookStepper at={1} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Slots calendar (existing component, wrapped in a B card) */}
        <BCard padding={18}>
          {slots.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              No available slots at the moment.
            </p>
          ) : (
            <>
              <BCap>Available · upcoming weeks · IST</BCap>
              <div style={{ marginTop: 12 }}>
                <SlotsCalendar
                  slots={slots}
                  selectedSlotId={selectedSlot?.id ?? null}
                  onSlotSelect={onSlotSelect}
                  mode="book"
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 14,
                  marginTop: 14,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--text-faint)',
                }}
              >
                <span style={{ marginLeft: 'auto' }}>
                  RESCHEDULES FREE UP TO 24 H BEFORE
                </span>
              </div>
            </>
          )}
        </BCard>

        {/* Selection summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <BCard>
            <BCap>{selectedSlot ? 'You picked' : 'Pick a slot to continue'}</BCap>
            {selectedSlot ? (
              <SlotSummary slot={selectedSlot} doctor={doctor} />
            ) : (
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: 13.5,
                  color: 'var(--text-faint)',
                  marginTop: 12,
                  lineHeight: 1.55,
                }}
              >
                Tap any slot on the left to see it here.
              </p>
            )}
          </BCard>
          <button
            type="button"
            onClick={onContinue}
            disabled={!selectedSlot}
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 13.5,
              padding: '12px 18px',
              borderRadius: 999,
              background: selectedSlot ? 'var(--primary)' : 'var(--border-strong)',
              color: '#fff',
              border: 'none',
              fontWeight: 500,
              opacity: selectedSlot ? 1 : 0.6,
              cursor: selectedSlot ? 'pointer' : 'not-allowed',
            }}
          >
            Continue to payment ›
          </button>
          <button
            type="button"
            onClick={onBack}
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 12.5,
              padding: '9px 14px',
              borderRadius: 999,
              background: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
            }}
          >
            ‹ Change therapist
          </button>
        </div>
      </div>
    </>
  )
}

function SlotSummary({
  slot,
  doctor,
}: {
  slot: CalendarSlot
  doctor: Doctor
}) {
  const date = new Date(slot.date)
  const dayLetter = date
    .toLocaleDateString('en-IN', { weekday: 'short' })
    .toUpperCase()
  const dayNum = date.getDate().toString().padStart(2, '0')
  const monthAbbr = date
    .toLocaleDateString('en-IN', { month: 'short' })
    .toUpperCase()
  const timeLabel = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  return (
    <>
      <div style={{ display: 'flex', gap: 14, marginTop: 14, alignItems: 'center' }}>
        <div
          style={{
            background: 'var(--primary)',
            color: '#fff',
            borderRadius: 10,
            padding: '10px 0',
            width: 78,
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 10.5, opacity: 0.7 }}>
            {dayLetter}
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, lineHeight: 1, marginTop: 1, fontWeight: 500 }}>
            {dayNum}
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 10.5, opacity: 0.7, marginTop: 1 }}>
            {monthAbbr}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 500 }}>
            {timeLabel} IST
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            50 min · Google Meet
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
        {doctor.photo ? (
          <Image
            src={doctor.photo}
            alt={doctor.user.name}
            width={28}
            height={28}
            className="rounded-full object-cover"
          />
        ) : (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'linear-gradient(160deg, var(--accent-tint), var(--accent))',
            }}
          />
        )}
        <div style={{ fontSize: 12.5, color: 'var(--text)' }}>{doctor.user.name}</div>
      </div>
    </>
  )
}

// ─── STEP 3 — Confirm + pay ────────────────────────────────────────

function Step3({
  doctor,
  slot,
  booking,
  paymentData,
  authSessionUser,
  onBack,
  onBook,
  onPaymentSuccess,
  onPaymentDismiss,
}: {
  doctor: Doctor
  slot: CalendarSlot
  booking: boolean
  paymentData: { razorpayOrderId: string; amount: number; sessionId: string } | null
  authSessionUser: { name?: string | null; email?: string | null } | null
  onBack: () => void
  onBook: () => void
  onPaymentSuccess: (r: RazorpayResponse) => void
  onPaymentDismiss: () => void
}) {
  const price = Math.round(Number(doctor.sessionPrice))
  const slotDate = new Date(slot.date)
  return (
    <>
      <BPageHeader
        title="Confirm and pay."
        breadcrumb={[
          { label: 'SESSIONS', href: '/user/sessions' },
          { label: 'BOOK' },
          { label: 'STEP 3 OF 3' },
        ]}
        sub="One charge. No subscription. Refundable up to 24 h before the session."
        ctas={['search']}
      />
      <BBookStepper at={2} />

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
        {/* LEFT — booking summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <BCard>
            <BCap>Your booking</BCap>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 14,
                marginTop: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Therapist</div>
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 16,
                    fontWeight: 500,
                    color: 'var(--text)',
                    marginTop: 2,
                  }}
                >
                  {doctor.user.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {doctor.designation}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>When</div>
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 16,
                    fontWeight: 500,
                    color: 'var(--text)',
                    marginTop: 2,
                  }}
                >
                  {formatSessionDateLong(slotDate)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  50 min · Google Meet
                </div>
              </div>
            </div>
          </BCard>

          {paymentData && authSessionUser ? (
            <BCard>
              <BCap>Complete payment</BCap>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', margin: '12px 0 14px' }}>
                Amount: ₹{(paymentData.amount / 100).toLocaleString('en-IN')}
              </div>
              <RazorpayCheckout
                orderId={paymentData.razorpayOrderId}
                amount={paymentData.amount}
                name={authSessionUser.name ?? ''}
                email={authSessionUser.email ?? ''}
                description={`Session with ${doctor.user.name}`}
                onSuccess={onPaymentSuccess}
                onDismiss={onPaymentDismiss}
                buttonText={`Pay ₹${(paymentData.amount / 100).toLocaleString('en-IN')}`}
              />
            </BCard>
          ) : (
            <BCard>
              <BCap>Care &amp; consent</BCap>
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  marginTop: 10,
                  lineHeight: 1.6,
                }}
              >
                Sessions are 50 minutes. You can reschedule once for free up to 24 hours
                before. Crisis lines are not Mindset — see the footer for helplines.
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10.5,
                  color: 'var(--text-faint)',
                  marginTop: 12,
                }}
              >
                SECURED BY RAZORPAY · NO RECURRING CHARGE
              </p>
            </BCard>
          )}

          <button
            type="button"
            onClick={onBack}
            disabled={booking}
            style={{
              alignSelf: 'flex-start',
              fontFamily: 'var(--font-heading)',
              fontSize: 12.5,
              padding: '9px 14px',
              borderRadius: 999,
              background: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              opacity: booking ? 0.5 : 1,
            }}
          >
            ‹ Back to slots
          </button>
        </div>

        {/* RIGHT — total + pay */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <BCard>
            <BCap>Total today</BCap>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                marginTop: 10,
                fontSize: 13.5,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Session fee</span>
                <span>₹{price.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Platform fee</span>
                <span>₹0</span>
              </div>
              <div
                style={{
                  borderTop: '1px solid var(--border)',
                  paddingTop: 10,
                  marginTop: 4,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  Total
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 26,
                    fontWeight: 500,
                  }}
                >
                  ₹{price.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onBook}
              disabled={booking || !!paymentData}
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 14,
                padding: '12px 20px',
                borderRadius: 999,
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                marginTop: 14,
                width: '100%',
                fontWeight: 500,
                opacity: booking || paymentData ? 0.6 : 1,
                cursor: booking || paymentData ? 'not-allowed' : 'pointer',
              }}
            >
              {booking
                ? 'Preparing payment…'
                : paymentData
                  ? 'Razorpay ready below'
                  : `Pay ₹${price.toLocaleString('en-IN')} · book this slot`}
            </button>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text-faint)',
                marginTop: 8,
                textAlign: 'center',
              }}
            >
              SECURED BY RAZORPAY · NO RECURRING CHARGE
            </p>
          </BCard>
          <BCard padding={14}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <BChip kind="primary">CHECKED</BChip>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                By booking, you accept our care &amp; consent terms — 50-minute
                sessions, one free reschedule up to 24 h before, and Mindset is
                not an emergency service.
              </p>
            </div>
          </BCard>
        </div>
      </div>
    </>
  )
}
