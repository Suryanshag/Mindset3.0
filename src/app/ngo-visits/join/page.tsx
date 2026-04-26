'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ngoJoinSchema } from '@/lib/validations/ngo'
import { z } from 'zod'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle } from 'lucide-react'

type NgoJoinFormData = z.infer<typeof ngoJoinSchema>

const inputClassName =
  'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors'

export default function NgoJoinPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<NgoJoinFormData>({
    resolver: zodResolver(ngoJoinSchema),
  })

  const onSubmit = async (data: NgoJoinFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ngo/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || 'Something went wrong')
        return
      }

      setSuccess(true)
      setWhatsappLink(result.data?.whatsappLink ?? null)
      reset()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div
        className="min-h-[60vh] flex items-center justify-center"
        style={{ background: 'var(--cream)' }}
      >
        <div className="max-w-md mx-auto px-4 text-center animate-fade-in">
          <div className="card-premium p-10">
            <CheckCircle size={56} className="mx-auto mb-4" style={{ color: 'var(--teal)' }} />
            <h2
              className="font-heading text-2xl font-bold mb-2"
              style={{ color: 'var(--navy)' }}
            >
              Thank You!
            </h2>
            <p className="text-gray-600 mb-6">
              You&apos;ve been registered for our next NGO drive.
            </p>
            {whatsappLink ? (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 rounded-xl text-white font-semibold transition-colors"
                style={{ background: '#25D366' }}
              >
                Join WhatsApp Group
              </a>
            ) : (
              <p className="text-sm text-gray-500">
                We&apos;ll contact you soon via email.
              </p>
            )}
            <div className="mt-6">
              <Link
                href="/ngo-visits"
                className="text-sm font-semibold flex items-center justify-center gap-1"
                style={{ color: 'var(--coral)' }}
              >
                <ArrowLeft size={14} />
                Back to NGO Visits
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--cream)' }}>
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/ngo-visits"
          className="text-sm font-semibold flex items-center gap-1 mb-6"
          style={{ color: 'var(--coral)' }}
        >
          <ArrowLeft size={14} />
          Back to NGO Visits
        </Link>

        <h1
          className="font-heading text-3xl md:text-4xl font-bold mb-2"
          style={{ color: 'var(--coral)' }}
        >
          Join an NGO Drive
        </h1>
        <p className="mb-8" style={{ color: 'var(--navy)', opacity: 0.7 }}>
          Fill in your details and we&apos;ll get you involved in our next community outreach.
        </p>

        {error && (
          <div
            className="mb-4 p-3 rounded-xl text-sm"
            style={{ background: '#FEE2E2', color: '#991B1B' }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="card-premium p-6 md:p-8 space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--navy)' }}>
              Name
            </label>
            <input id="name" type="text" {...register('name')} className={inputClassName} />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--navy)' }}>
              Email
            </label>
            <input id="email" type="email" {...register('email')} className={inputClassName} />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--navy)' }}>
              Phone
            </label>
            <input id="phone" type="tel" {...register('phone')} placeholder="9876543210" className={inputClassName} />
            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--navy)' }}>
              City
            </label>
            <input id="city" type="text" {...register('city')} className={inputClassName} />
            {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>}
          </div>

          <div>
            <label htmlFor="age" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--navy)' }}>
              Age
            </label>
            <input
              id="age"
              type="number"
              min={13}
              max={100}
              {...register('age', { valueAsNumber: true })}
              className={inputClassName}
            />
            {errors.age && <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>}
          </div>

          <div>
            <label htmlFor="interest" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--navy)' }}>
              Why are you interested?
            </label>
            <textarea
              id="interest"
              rows={4}
              {...register('interest')}
              className={inputClassName}
            />
            {errors.interest && <p className="mt-1 text-sm text-red-600">{errors.interest.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full text-center disabled:opacity-50"
          >
            {isLoading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  )
}
