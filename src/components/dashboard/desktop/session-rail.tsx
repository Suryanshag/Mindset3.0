import Link from 'next/link'
import CancelSessionButton from '@/app/(dashboard)/user/sessions/[id]/cancel-button'

/** Extract a short display name, skipping "Dr." / "Dr" prefix. */
function shortName(fullName: string): string {
  const parts = fullName.split(' ').filter(Boolean)
  if (parts.length > 1 && /^Dr\.?$/i.test(parts[0])) return parts[1]
  return parts[0] ?? fullName
}

type SessionRailProps = {
  doctor: {
    name: string
    designation: string
    photo: string | null
  }
  doctorId: string
  sessionId: string
  canCancel: boolean
  assignments: { id: string; title: string; status: string }[]
}

export default function SessionRail({
  doctor,
  doctorId,
  sessionId,
  canCancel,
  assignments,
}: SessionRailProps) {
  const initials = doctor.name
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)

  return (
    <div className="space-y-6">
      {/* Doctor card */}
      <div className="text-center">
        {doctor.photo ? (
          <img
            src={doctor.photo}
            alt={doctor.name}
            className="w-14 h-14 rounded-full object-cover mx-auto"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mx-auto">
            <span className="text-sm font-medium text-white">{initials}</span>
          </div>
        )}
        <p className="text-[15px] font-medium text-text mt-3">{doctor.name}</p>
        <p className="text-[13px] text-text-muted">{doctor.designation}</p>
      </div>

      {/* Book follow-up */}
      <Link
        href={`/user/sessions/book?doctorId=${doctorId}`}
        className="flex items-center justify-center w-full py-2.5 rounded-full bg-primary text-white text-[13px] font-medium"
      >
        Book follow-up with {shortName(doctor.name)}
      </Link>

      {/* Assignments from this session */}
      {assignments.length > 0 && (
        <div>
          <p className="text-[11px] font-medium text-text-faint uppercase tracking-[0.6px] mb-3">
            Assignments
          </p>
          <div className="space-y-1.5">
            {assignments.map((a) => (
              <Link
                key={a.id}
                href={`/user/practice/assignments/${a.id}`}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-[13px] text-text transition-colors duration-150 hover:bg-white/60"
                style={{ border: '0.5px solid var(--color-border)' }}
              >
                <span className="truncate">{a.title}</span>
                <span className="text-[11px] text-text-faint capitalize shrink-0 ml-2">
                  {a.status.toLowerCase()}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Cancel session */}
      {canCancel && (
        <div className="pt-2">
          <p className="text-[13px] text-text-faint text-center mb-2">
            Need to reschedule?
          </p>
          <CancelSessionButton sessionId={sessionId} />
        </div>
      )}
    </div>
  )
}
