'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { Pencil, Loader2 } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { uploadAvatar } from '@/lib/actions/upload-avatar'
import AvatarCropModal from './avatar-crop-modal'

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
  const [cropSrc, setCropSrc] = useState<string | null>(null)

  // Pick a photo → normalize (fixes EXIF orientation, strips metadata) →
  // open the crop modal. Nothing uploads until the user frames the crop.
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    // Reset so picking the same file again still fires onChange.
    e.target.value = ''
    if (!file) return

    setPreparing(true)
    let normalized: File
    try {
      normalized = await imageCompression(file, {
        maxWidthOrHeight: 1600,
        // Main thread: the app's CSP blocks blob: workers (worker-src
        // falls back to script-src), so a web worker would silently fail.
        useWebWorker: false,
        fileType: 'image/jpeg',
      })
    } catch {
      normalized = file
    }
    setPreparing(false)
    setCropSrc(URL.createObjectURL(normalized))
  }

  function closeCrop() {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  // User confirmed the crop → compress to the server's 1MB limit → upload.
  async function handleCropConfirm(blob: Blob) {
    setPreview(URL.createObjectURL(blob))
    closeCrop()

    setPreparing(true)
    let compressed: File
    const cropped = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
    try {
      compressed = await imageCompression(cropped, {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1024,
        // Main thread: the app's CSP blocks blob: workers (worker-src
        // falls back to script-src), so a web worker would silently fail.
        useWebWorker: false,
        fileType: 'image/jpeg',
      })
    } catch {
      compressed = cropped
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
        className="relative w-full h-full rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/30"
        disabled={busy}
      >
        {preview ? (
          <Image
            src={preview}
            alt="Avatar"
            fill
            sizes="(max-width: 768px) 96px, 128px"
            className="object-cover"
            unoptimized
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

      {cropSrc && (
        <AvatarCropModal
          src={cropSrc}
          onCancel={closeCrop}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  )
}
