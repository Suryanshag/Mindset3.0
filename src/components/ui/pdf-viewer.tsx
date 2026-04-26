'use client'

import { useEffect, useState, useRef } from 'react'

interface PdfViewerProps {
  url: string
  title: string
  watermarkText?: string
}

export default function PdfViewer({ url, title, watermarkText }: PdfViewerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let revoked = false

    async function fetchPdf() {
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error('Failed to load PDF')
        const blob = await res.blob()
        const objectUrl = URL.createObjectURL(blob)
        if (!revoked) setBlobUrl(objectUrl)
      } catch {
        if (!revoked) setError('Failed to load PDF. Please try again.')
      } finally {
        if (!revoked) setLoading(false)
      }
    }

    fetchPdf()

    return () => {
      revoked = true
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p')) {
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div
            className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: 'var(--teal)', borderTopColor: 'transparent' }}
          />
          <p className="text-sm text-gray-500">Loading PDF...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onContextMenu={(e) => e.preventDefault()}
    >
      {blobUrl && (
        <iframe
          src={blobUrl}
          title={title}
          className="w-full h-full border-0"
          style={{ background: '#f5f5f5' }}
        />
      )}

      {watermarkText && (
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden select-none"
          style={{ zIndex: 10 }}
        >
          <div
            className="absolute inset-0 flex flex-wrap items-center justify-center gap-16"
            style={{
              transform: 'rotate(-30deg)',
              opacity: 0.06,
            }}
          >
            {Array.from({ length: 20 }).map((_, i) => (
              <span
                key={i}
                className="text-2xl font-bold whitespace-nowrap"
                style={{ color: 'var(--navy)' }}
              >
                {watermarkText}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
