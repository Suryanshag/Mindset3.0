import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { prisma } from '@/lib/prisma'

type StudyMaterial = {
  id: string
  title: string
  type: string
  price: unknown
  coverImage: string | null
}

function MaterialCover({ item }: { item: StudyMaterial }) {
  return (
    <div className="relative w-full h-32 rounded-xl bg-primary-tint flex items-center justify-center overflow-hidden">
      {item.coverImage ? (
        <img
          src={item.coverImage}
          alt={item.title}
          className="w-full h-full object-cover"
        />
      ) : (
        <BookOpen size={28} className="text-primary/30" />
      )}
      {/* Price badge */}
      <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-black/50 backdrop-blur-sm">
        <span className="text-[9px] font-medium text-white">
          {item.type === 'FREE' ? 'Free' : `\u20B9${Number(item.price)}`}
        </span>
      </div>
    </div>
  )
}

export default async function LibraryPage() {
  const materials = await prisma.studyMaterial
    .findMany({
      where: { isPublished: true },
      select: { id: true, title: true, type: true, price: true, coverImage: true },
      orderBy: { createdAt: 'desc' },
    })
    .catch(() => [] as StudyMaterial[])

  // No purchase tracking yet — "My library" is always empty for now.
  // "Recommended" shows real study materials from DB.

  return (
    <div className="space-y-5">
      <h1 className="text-[16px] font-medium text-text">Library</h1>

      {/* My library — empty state until purchase tracking exists */}
      <div className="flex flex-col items-center py-12">
        <BookOpen size={28} className="text-text-faint mb-2" />
        <p className="text-[14px] text-text-muted">
          No books in your library yet
        </p>
        <Link
          href="/study-materials"
          className="mt-3 text-[13px] font-medium text-primary"
        >
          Browse study materials
        </Link>
      </div>

      {/* Recommended — real data from DB */}
      {materials.length > 0 && (
        <div>
          <p className="text-[12px] font-medium text-text-faint uppercase tracking-wider mb-2.5">
            Recommended for you
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {materials.map((item) => (
              <Link
                key={item.id}
                href="/study-materials"
                className="bg-bg-card rounded-2xl p-2.5"
                style={{ border: '0.5px solid var(--color-border)' }}
              >
                <MaterialCover item={item} />
                <p className="text-[13px] font-medium text-text mt-2 line-clamp-2">
                  {item.title}
                </p>
                <p className="text-[11px] text-text-faint mt-0.5">
                  {item.type === 'FREE' ? 'Free' : `\u20B9${Number(item.price)}`}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
