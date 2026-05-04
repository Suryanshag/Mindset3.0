import Link from 'next/link'
import Image from 'next/image'
import { Clock, ArrowRight } from 'lucide-react'
import { Prisma } from '@prisma/client'

type Decimal = Prisma.Decimal

type DoctorCardProps = {
  slug: string
  photo: string | null
  designation: string
  type: 'COUNSELOR' | 'PSYCHOLOGIST'
  specialization: string
  experience: number
  sessionPrice: Decimal
  user: { name: string }
}

export default function DoctorCard({
  slug,
  photo,
  designation,
  type,
  specialization,
  experience,
  sessionPrice,
  user,
}: DoctorCardProps) {
  const typeColor = type === 'COUNSELOR' ? 'var(--teal)' : 'var(--coral)'

  return (
    <div className="card-premium overflow-hidden group">
      {/* Photo area */}
      <div className="relative w-full h-56 bg-gray-100 overflow-hidden">
        {photo ? (
          <Image
            src={photo}
            alt={user.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div
            className="flex items-center justify-center h-full"
            style={{ background: `${typeColor}15` }}
          >
            <span
              className="font-heading text-5xl font-bold"
              style={{ color: typeColor, opacity: 0.4 }}
            >
              {user.name.charAt(0)}
            </span>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-5">
        <h3
          className="font-heading text-xl font-bold mb-1"
          style={{ color: 'var(--navy)' }}
        >
          {user.name}
        </h3>
        <p className="text-sm text-gray-500 mb-3">{designation}</p>

        {/* Type badge */}
        <span
          className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3"
          style={{ background: `${typeColor}15`, color: typeColor }}
        >
          {type}
        </span>

        {/* Specialization tags */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{specialization}</p>

        {/* Experience + Price row */}
        <div className="flex items-center justify-between mb-4">
          <span className="flex items-center gap-1.5 text-sm text-gray-500">
            <Clock size={14} />
            {experience} yrs exp
          </span>
          <span
            className="text-lg font-bold"
            style={{ color: 'var(--navy)' }}
          >
            ₹{sessionPrice.toString()}
            <span className="text-xs font-normal text-gray-400">/session</span>
          </span>
        </div>

        {/* CTA */}
        <Link
          href={`/doctors/${slug}`}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all duration-200"
          style={{ background: 'var(--teal)' }}
        >
          View Profile
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  )
}
