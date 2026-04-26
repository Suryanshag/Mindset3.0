'use client'

import { useRef, useState, useTransition } from 'react'
import { Pencil, Loader2 } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { uploadAvatar } from '@/lib/actions/upload-avatar'

type Props = {
  currentUrl: string | null
  initials: string
  size?: number
}

export default function AvatarUpload({ currentUrl, initials, size = 96 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState(currentUrl)
  const [isPending, startTransition] = useTransition()
  const [preparing, setPreparing] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Optimistic preview from original
    setPreview(URL.createObjectURL(file))

    // Client-side compression to fit within server action 1MB limit.
    // browser-image-compression handles EXIF orientation correctly.
    setPreparing(true)
    let compressed: File
    try {
      compressed = await imageCompression(file, {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        fileType: 'image/jpeg',
      })
    } catch {
      // Fall back to original if compression fails
      compressed = file
    }
    setPreparing(false)

    const fd = new FormData()
    fd.append('avatar', compressed)

    startTransition(async () => {
      const result = await uploadAvatar(fd)
      if (result.url) {
        setPreview(result.url)
      } else {
        setPreview(currentUrl)
      }
    })
  }

  const busy = isPending || preparing

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <button
        onClick={() => inputRef.current?.click()}
        className="w-full h-full rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/30"
        disabled={busy}
      >
        {preview ? (
          <img
            src={preview}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-primary flex items-center justify-center">
            <span className="text-2xl font-medium text-white">{initials}</span>
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-1">
              <Loader2 size={18} className="text-white animate-spin" />
              {preparing && (
                <span className="text-[10px] text-white/80">Preparing...</span>
              )}
            </div>
          </div>
        )}
      </button>

      {/* Edit pencil overlay */}
      <div
        className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-bg-card flex items-center justify-center"
        style={{ border: '2px solid var(--color-bg-app)' }}
      >
        <Pencil size={12} className="text-text-muted" />
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
