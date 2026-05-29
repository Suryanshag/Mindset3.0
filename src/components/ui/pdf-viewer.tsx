'use client'

import { useEffect, useRef, useState } from 'react'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'

interface PdfViewerProps {
  url: string
  title: string
  watermarkText?: string
}

// Renders the PDF to <canvas> via pdf.js. Canvas works everywhere (desktop,
// mobile, PWA) — unlike an <iframe>, which mobile browsers refuse to render
// PDFs in. Pages are rendered lazily on scroll so a large ebook doesn't blow
// the mobile memory budget. The worker is served same-origin from /public so
// the app CSP (script-src 'self') allows it.
export default function PdfViewer({ url, watermarkText }: PdfViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const pagesRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    let pdfDoc: PDFDocumentProxy | null = null
    let io: IntersectionObserver | null = null

    async function run() {
      try {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

        const res = await fetch(url)
        if (!res.ok) throw new Error('fetch failed')
        const data = await res.arrayBuffer()
        if (cancelled) return

        pdfDoc = await pdfjsLib.getDocument({ data }).promise
        const host = pagesRef.current
        const scroller = scrollRef.current
        if (cancelled || !host || !scroller) return
        host.replaceChildren()

        const hostWidth = host.clientWidth || 800
        const dpr = Math.min(window.devicePixelRatio || 1, 2)

        // Build a placeholder per page (correct height) so the scrollbar is
        // accurate, then fill canvases lazily as each page nears the viewport.
        const pages: { page: PDFPageProxy; cssScale: number }[] = []
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          if (cancelled) return
          const page = await pdfDoc.getPage(i)
          const base = page.getViewport({ scale: 1 })
          const cssScale = hostWidth / base.width
          const ph = document.createElement('div')
          ph.dataset.page = String(i)
          ph.style.width = '100%'
          ph.style.height = `${base.height * cssScale}px`
          ph.style.marginBottom = '10px'
          ph.style.background = '#fff'
          ph.style.boxShadow = '0 1px 4px rgba(0,0,0,0.15)'
          host.appendChild(ph)
          pages.push({ page, cssScale })
          if (i === 1 && !cancelled) setLoading(false)
        }
        if (cancelled) return
        setLoading(false)

        const rendered = new Set<number>()
        io = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue
              const el = entry.target as HTMLElement
              const idx = Number(el.dataset.page)
              if (rendered.has(idx)) continue
              rendered.add(idx)
              const { page, cssScale } = pages[idx - 1]
              const viewport = page.getViewport({ scale: cssScale * dpr })
              const canvas = document.createElement('canvas')
              canvas.width = Math.floor(viewport.width)
              canvas.height = Math.floor(viewport.height)
              canvas.style.width = '100%'
              canvas.style.height = '100%'
              canvas.style.display = 'block'
              el.replaceChildren(canvas)
              page.render({ canvas, viewport }).promise.catch(() => {})
            }
          },
          { root: scroller, rootMargin: '150% 0px' },
        )
        host.querySelectorAll('[data-page]').forEach((el) => io!.observe(el))
      } catch {
        if (!cancelled) {
          setError('Failed to load PDF. Please try again.')
          setLoading(false)
        }
      }
    }

    run()
    return () => {
      cancelled = true
      io?.disconnect()
      pdfDoc?.destroy().catch(() => {})
    }
  }, [url])

  // Best-effort: block Ctrl/Cmd+S and +P.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p')) e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div
      ref={scrollRef}
      className="relative w-full h-full overflow-auto"
      style={{ background: 'var(--bg-app)' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div ref={pagesRef} style={{ maxWidth: 820, margin: '0 auto', padding: 16 }} />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div
              className="w-8 h-8 rounded-full animate-spin mx-auto mb-3"
              style={{ border: '3px solid var(--teal)', borderTopColor: 'transparent' }}
            />
            <p className="text-sm text-gray-500">Loading PDF...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {watermarkText && (
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden select-none"
          style={{ zIndex: 10 }}
        >
          <div
            className="absolute inset-0 flex flex-wrap items-center justify-center gap-16"
            style={{ transform: 'rotate(-30deg)', opacity: 0.06 }}
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
