'use client'

import { useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import Cropper, { type Area } from 'react-easy-crop'

// Draw the selected crop region to a canvas and return a JPEG blob. `src`
// is a same-origin object URL (no canvas taint). The source image is already
// EXIF-normalized by browser-image-compression before it reaches the cropper.
async function getCroppedBlob(src: string, area: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(area.width))
  canvas.height = Math.max(1, Math.round(area.height))
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    canvas.width,
    canvas.height,
  )
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('crop failed'))),
      'image/jpeg',
      0.95,
    )
  })
}

type Props = {
  src: string
  onCancel: () => void
  onConfirm: (blob: Blob) => void
}

export default function AvatarCropModal({ src, onCancel, onConfirm }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [area, setArea] = useState<Area | null>(null)
  const [working, setWorking] = useState(false)

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setArea(pixels)
  }, [])

  async function confirm() {
    if (!area || working) return
    setWorking(true)
    try {
      const blob = await getCroppedBlob(src, area)
      onConfirm(blob)
    } catch {
      setWorking(false)
    }
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          color: '#fff',
          textAlign: 'center',
          padding: '16px 20px 8px',
          fontWeight: 700,
          fontSize: 15,
        }}
      >
        Move and zoom to fit
      </div>

      <div style={{ position: 'relative', flex: 1 }}>
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          restrictPosition
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <div
        style={{
          padding: '18px 20px calc(env(safe-area-inset-bottom, 0px) + 18px)',
          background: 'var(--bg-app)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          aria-label="Zoom"
          style={{ width: '100%', accentColor: 'var(--primary)' }}
        />
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={working}
            style={{
              flex: 1,
              padding: '13px',
              borderRadius: 999,
              background: 'var(--bg-card)',
              color: 'var(--text)',
              fontWeight: 700,
              fontSize: 14,
              border: '1px solid var(--color-border)',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={working || !area}
            style={{
              flex: 1,
              padding: '13px',
              borderRadius: 999,
              background: 'var(--primary)',
              color: '#fff',
              fontWeight: 800,
              fontSize: 14,
              opacity: working || !area ? 0.6 : 1,
            }}
          >
            {working ? 'Saving…' : 'Use photo'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
