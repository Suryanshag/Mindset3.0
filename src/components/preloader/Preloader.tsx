'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import styles from './preloader.module.css'

export default function Preloader({ onComplete }: { onComplete?: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const counterRef = useRef<HTMLDivElement>(null)
  const [done, setDone] = useState(false)
  const [skip, setSkip] = useState(false)

  const handleComplete = useCallback(() => {
    document.body.style.overflow = ''
    sessionStorage.setItem('preloader-shown', '1')
    setDone(true)

    gsap.registerPlugin(ScrollTrigger)
    ScrollTrigger.refresh()

    // Handle hash scroll after preloader
    const hash = window.location.hash
    if (hash) {
      requestAnimationFrame(() => {
        const el = document.querySelector(hash)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }

    onComplete?.()
  }, [onComplete])

  useEffect(() => {
    // Subsequent-visit short-circuit: if the flag is already set we hide the
    // loader and bail out BEFORE touching the canvas / GSAP. Combining this
    // check with the animation setup into one effect (instead of two parallel
    // ones) eliminates the race where the second effect started a 0% wave
    // frame that never advanced.
    if (sessionStorage.getItem('preloader-shown')) {
      setSkip(true)
      return
    }
    // First visit — claim the flag immediately so an early navigation
    // doesn't leave a future mount stuck.
    sessionStorage.setItem('preloader-shown', '1')
    document.body.style.overflow = 'hidden'

    const overlay = overlayRef.current
    const logo = logoRef.current
    const canvas = canvasRef.current
    const counter = counterRef.current
    if (!overlay || !logo || !canvas || !counter) return

    // Canvas setup with device pixel ratio
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
    canvas.width = w * dpr
    canvas.height = h * dpr
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)

    // Wave amplitude: smaller on mobile
    const waveAmp = w > 600 ? 50 : 25

    // Animation state
    const progress = { value: 0 }
    let waveOffset = 0
    let animFrameId: number

    function drawWave() {
      if (!ctx) return
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#FFF8EB'

      const fillHeight = progress.value / 100

      ctx.beginPath()
      ctx.moveTo(0, h)

      for (let x = 0; x <= w; x++) {
        const baseY = h - fillHeight * h
        const wave =
          Math.sin(0.02 * x + waveOffset) *
          Math.sin(0.01 * x + waveOffset) *
          Math.sin(0.05 * x + waveOffset) *
          waveAmp
        ctx.lineTo(x, baseY - wave)
      }

      ctx.lineTo(w, h)
      ctx.closePath()
      ctx.fill()

      waveOffset += 0.03
      animFrameId = requestAnimationFrame(drawWave)
    }

    drawWave()

    // GSAP timeline
    const tl = gsap.timeline({
      delay: 0.5,
      onComplete: () => {
        cancelAnimationFrame(animFrameId)
      },
    })

    // Phase 1: Fill wave from 0 to 100%
    tl.to(progress, {
      value: 100,
      duration: 2.5,
      ease: 'power2.inOut',
      onUpdate: () => {
        const pct = Math.round(progress.value)
        counter.textContent = `loading... ${pct}%`
      },
    })

    // Phase 2: Fade counter
    tl.to(counter, {
      opacity: 0,
      duration: 0.2,
      ease: 'power1.out',
    })

    // Phase 3: Scale logo up slightly and fade out overlay
    tl.to(logo, {
      scale: 1.08,
      duration: 0.5,
      ease: 'power2.inOut',
    })

    tl.to(
      overlay,
      {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.inOut',
        onComplete: handleComplete,
      },
      '<0.1'
    )

    return () => {
      cancelAnimationFrame(animFrameId)
      tl.kill()
      document.body.style.overflow = ''
    }
  }, [handleComplete])

  if (skip || done) return null

  return (
    <div ref={overlayRef} className={styles.overlay}>
      <div className={styles.inner}>
        <div ref={logoRef} className={styles.logoWrap}>
          <canvas ref={canvasRef} className={styles.canvas} />
        </div>
        <div ref={counterRef} className={styles.counter}>
          loading... 0%
        </div>
      </div>
    </div>
  )
}
