'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Download, Eye } from 'lucide-react'
import PdfModal from '@/components/ui/pdf-modal'
import PdfViewer from '@/components/ui/pdf-viewer'

interface FreeMaterialActionsProps {
  materialId: string
  title: string
}

export default function FreeMaterialActions({ materialId, title }: FreeMaterialActionsProps) {
  const { data: session } = useSession()
  const [showViewer, setShowViewer] = useState(false)

  if (!session?.user) {
    return (
      <Link
        href="/login?callbackUrl=/study-materials"
        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors"
        style={{ background: 'var(--cream)', color: 'var(--navy)' }}
      >
        <Download size={16} />
        Login to Access
      </Link>
    )
  }

  const serveUrl = `/api/user/ebooks/${materialId}/serve`

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => setShowViewer(true)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-colors"
          style={{ background: 'var(--teal)' }}
        >
          <Eye size={16} />
          Preview
        </button>
        <a
          href={serveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-colors"
          style={{ background: '#059669' }}
        >
          <Download size={16} />
        </a>
      </div>

      <PdfModal isOpen={showViewer} onClose={() => setShowViewer(false)} title={title}>
        <PdfViewer url={serveUrl} title={title} />
      </PdfModal>
    </>
  )
}
