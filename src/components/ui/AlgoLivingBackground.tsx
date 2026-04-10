'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

type BgVariant = 'home' | 'video' | 'news' | 'interactive' | 'calm' | 'default'

interface LayerLine {
  amp: number
  freq: number
  speed: number
  thickness: number
  alpha: number
  phase: number
  yBase: number
  depth: number
}

interface SweepState {
  active: boolean
  progress: number
  direction: 1 | -1
  width: number
  intensity: number
  nextAt: number
}

function getVariant(pathname: string): BgVariant {
  if (pathname === '/') return 'home'
  if (pathname.includes('/videos') || pathname.includes('/video')) return 'video'
  if (pathname.includes('/news')) return 'news'
  if (
    pathname.includes('/trends') ||
    pathname.includes('/viral-analyzer') ||
    pathname.includes('/creator-mode') ||
    pathname.includes('/intelligence') ||
    pathname.includes('/ai')
  ) {
    return 'interactive'
  }
  if (
    pathname.includes('/legal') ||
    pathname.includes('/privacy') ||
    pathname.includes('/transparency') ||
    pathname.includes('/algorithm')
  ) {
    return 'calm'
  }
  return 'default'
}

function getVariantTuning(variant: BgVariant) {
  switch (variant) {
    case 'home':
      return { baseAlpha: 0.2, speedMul: 1, depthBlur: 1.1, glow: 0.22 }
    case 'video':
      return { baseAlpha: 0.16, speedMul: 0.85, depthBlur: 1.3, glow: 0.16 }
    case 'news':
      return { baseAlpha: 0.24, speedMul: 1.2, depthBlur: 1.0, glow: 0.24 }
    case 'interactive':
      return { baseAlpha: 0.22, speedMul: 1.1, depthBlur: 1.0, glow: 0.2 }
    case 'calm':
      return { baseAlpha: 0.12, speedMul: 0.72, depthBlur: 1.25, glow: 0.12 }
    default:
      return { baseAlpha: 0.18, speedMul: 1.0, depthBlur: 1.15, glow: 0.18 }
  }
}

export function AlgoLivingBackground() {
  const pathname = usePathname()
  const variant = useMemo(() => getVariant(pathname), [pathname])
  const tuning = useMemo(() => getVariantTuning(variant), [variant])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const linesRef = useRef<LayerLine[]>([])
  const pointerRef = useRef({ x: 0.5, y: 0.5, active: false })
  const scrollRef = useRef(0)
  const sweepRef = useRef<SweepState>({
    active: false,
    progress: 0,
    direction: 1,
    width: 0.14,
    intensity: 0.18,
    nextAt: 0,
  })
  const [enabled, setEnabled] = useState(true)
  const [tabVisible, setTabVisible] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const lowCore = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4
    const lowMem = 'deviceMemory' in navigator && ((navigator as Navigator & { deviceMemory?: number }).deviceMemory || 8) <= 4
    setEnabled(!media.matches && !(lowCore && lowMem))
    const onChange = () => setEnabled(!media.matches && !(lowCore && lowMem))
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const onVisibility = () => setTabVisible(document.visibilityState === 'visible')
    onVisibility()
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 1.75)
    const buildLines = (w: number, h: number) => {
      const lineCount = 9
      linesRef.current = Array.from({ length: lineCount }, (_, i) => ({
        amp: 10 + i * 2.3,
        freq: 0.004 + i * 0.0009,
        speed: (0.17 + i * 0.05) * tuning.speedMul,
        thickness: i < 3 ? 1.2 : 0.8,
        alpha: tuning.baseAlpha - i * 0.012,
        phase: Math.random() * Math.PI * 2,
        yBase: (h / (lineCount + 1)) * (i + 1),
        depth: i / lineCount,
      }))
    }

    const resize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      buildLines(w, h)
    }

    resize()
    window.addEventListener('resize', resize)

    const onPointer = (e: MouseEvent) => {
      pointerRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
        active: true,
      }
    }
    const onLeave = () => {
      pointerRef.current.active = false
    }
    const onScroll = () => {
      scrollRef.current = window.scrollY
    }
    window.addEventListener('mousemove', onPointer, { passive: true })
    window.addEventListener('mouseleave', onLeave)
    window.addEventListener('scroll', onScroll, { passive: true })

    const scheduleSweep = (now: number) => {
      const gap = 5000 + Math.random() * 9000
      sweepRef.current.nextAt = now + gap
      sweepRef.current.direction = Math.random() > 0.5 ? 1 : -1
      sweepRef.current.width = 0.09 + Math.random() * 0.1
      sweepRef.current.intensity = 0.12 + Math.random() * 0.12
    }
    scheduleSweep(performance.now())

    let lastFrameTs = 0
    const draw = (time: number) => {
      if (!tabVisible) {
        rafRef.current = requestAnimationFrame(draw)
        return
      }
      if (time - lastFrameTs < 16) {
        rafRef.current = requestAnimationFrame(draw)
        return
      }
      lastFrameTs = time

      const w = canvas.width / dpr
      const h = canvas.height / dpr
      const pointer = pointerRef.current
      const parallaxX = pointer.active ? (pointer.x - 0.5) * 14 : 0
      const parallaxY = pointer.active ? (pointer.y - 0.5) * 8 : 0
      const scrollParallax = Math.min(scrollRef.current * 0.02, 30)

      ctx.clearRect(0, 0, w, h)

      // Subtle cyber-organic glow fields
      const g1 = ctx.createRadialGradient(w * 0.2 + parallaxX, h * 0.2 + parallaxY, 20, w * 0.2, h * 0.2, 360)
      g1.addColorStop(0, `rgba(123,97,255,${tuning.glow})`)
      g1.addColorStop(1, 'rgba(123,97,255,0)')
      ctx.fillStyle = g1
      ctx.fillRect(0, 0, w, h)

      const g2 = ctx.createRadialGradient(w * 0.78 - parallaxX, h * 0.75 - parallaxY, 20, w * 0.78, h * 0.75, 420)
      g2.addColorStop(0, `rgba(0,209,255,${tuning.glow * 0.9})`)
      g2.addColorStop(1, 'rgba(0,209,255,0)')
      ctx.fillStyle = g2
      ctx.fillRect(0, 0, w, h)

      // Layered wave/data curves
      for (const line of linesRef.current) {
        const blur = (1 - line.depth) * tuning.depthBlur
        ctx.filter = blur > 0.6 ? `blur(${blur}px)` : 'none'
        ctx.beginPath()
        for (let x = -6; x <= w + 6; x += 6) {
          const y =
            line.yBase +
            Math.sin(x * line.freq + time * 0.001 * line.speed + line.phase) * line.amp +
            Math.sin(x * (line.freq * 1.8) - time * 0.0008 * line.speed) * (line.amp * 0.32) +
            parallaxY * (0.4 + line.depth) +
            scrollParallax * (0.04 + line.depth * 0.05)
          if (x === -6) ctx.moveTo(x + parallaxX * line.depth, y)
          else ctx.lineTo(x + parallaxX * line.depth, y)
        }
        ctx.strokeStyle = `rgba(160,170,255,${Math.max(0.04, line.alpha)})`
        ctx.lineWidth = line.thickness
        ctx.stroke()
      }
      ctx.filter = 'none'

      // Organic scanner sweep with irregular timing
      const sweep = sweepRef.current
      if (!sweep.active && time >= sweep.nextAt) {
        sweep.active = true
        sweep.progress = sweep.direction === 1 ? -sweep.width : 1 + sweep.width
      }
      if (sweep.active) {
        sweep.progress += sweep.direction * 0.0032 * tuning.speedMul
        const done = sweep.direction === 1 ? sweep.progress > 1 + sweep.width : sweep.progress < -sweep.width
        const sweepX = w * sweep.progress

        const grad = ctx.createLinearGradient(sweepX - w * sweep.width, 0, sweepX + w * sweep.width, 0)
        grad.addColorStop(0, 'rgba(180,220,255,0)')
        grad.addColorStop(0.45, `rgba(180,220,255,${sweep.intensity})`)
        grad.addColorStop(0.5, `rgba(220,245,255,${sweep.intensity * 1.4})`)
        grad.addColorStop(0.55, `rgba(180,220,255,${sweep.intensity})`)
        grad.addColorStop(1, 'rgba(180,220,255,0)')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)

        if (done) {
          sweep.active = false
          scheduleSweep(time)
        }
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onPointer)
      window.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('scroll', onScroll)
    }
  }, [enabled, tuning, tabVisible])

  return (
    <div aria-hidden className="fixed inset-0 pointer-events-none z-0">
      {enabled ? (
        <canvas ref={canvasRef} className="absolute inset-0 opacity-80" />
      ) : (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-bg-primary)] via-[var(--color-bg-secondary)] to-[var(--color-bg-primary)]" />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'radial-gradient(50% 35% at 20% 20%, rgba(123,97,255,0.25), rgba(123,97,255,0) 70%), radial-gradient(45% 35% at 80% 70%, rgba(0,209,255,0.22), rgba(0,209,255,0) 70%)',
            }}
          />
        </div>
      )}
    </div>
  )
}
