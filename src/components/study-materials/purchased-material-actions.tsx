'use client'

import { useState } from 'react'
import { BookOpen, Download } from 'lucide-react'
import PdfModal from '@/components/ui/pdf-modal'
import PdfViewer from '@/components/ui/pdf-viewer'

interface PurchasedMaterialActionsProps {
  materialId: string
  title: string
  userEmail: string
}

export default function PurchasedMaterialActions({
  materialId,
  title,
  userEmail,
}: PurchasedMaterialActionsProps) {
  const [showViewer, setShowViewer] = useState(false)

  const serveUrl = `/api/user/ebooks/${materialId}/serve`

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => setShowViewer(true)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-colors"
          style={{ background: 'var(--teal)' }}
        >
          <BookOpen size={16} />
          Read Now
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
        <PdfViewer url={serveUrl} title={title} watermarkText={userEmail} />
      </PdfModal>
    </>
  )
}
