'use client'

import { useEffect, useRef, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  alpha: number
  life: number
  maxLife: number
}

interface Connection {
  from: number
  to: number
  alpha: number
}

interface AnimatedBackgroundProps {
  intensity?: number // 0-100, controls particle count and activity
  showConnections?: boolean
  showGlow?: boolean
  className?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = [
  'rgba(123, 97, 255, ',   // Violet
  'rgba(0, 209, 255, ',    // Cyan
  'rgba(0, 255, 178, ',    // Green
  'rgba(255, 77, 109, ',   // Red
  'rgba(255, 209, 102, ',  // Yellow
]

// ─── Main Component ───────────────────────────────────────────────────────────

export function AnimatedBackground({
  intensity = 50,
  showConnections = true,
  showGlow = true,
  className
}: AnimatedBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: 0, y: 0, active: false })
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  
  // Calculate particle count based on intensity and screen size
  const particleCount = useMemo(() => {
    const baseCount = Math.floor((dimensions.width * dimensions.height) / 25000)
    return Math.max(20, Math.min(150, Math.floor(baseCount * (intensity / 50))))
  }, [dimensions, intensity])
  
  // Initialize particles
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const particles: Particle[] = []
    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle(dimensions.width, dimensions.height))
    }
    particlesRef.current = particles
  }, [particleCount, dimensions])
  
  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Handle mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true }
    }
    
    const handleMouseLeave = () => {
      mouseRef.current.active = false
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])
  
  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || dimensions.width === 0) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const animate = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height)
      
      const particles = particlesRef.current
      const mouse = mouseRef.current
      const connections: Connection[] = []
      
      // Update and draw particles
      particles.forEach((particle, i) => {
        // Update position
        particle.x += particle.vx
        particle.y += particle.vy
        particle.life--
        
        // Mouse interaction
        if (mouse.active) {
          const dx = mouse.x - particle.x
          const dy = mouse.y - particle.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < 150) {
            const force = (150 - distance) / 150
            particle.vx += (dx / distance) * force * 0.02
            particle.vy += (dy / distance) * force * 0.02
          }
        }
        
        // Apply friction
        particle.vx *= 0.99
        particle.vy *= 0.99
        
        // Boundary wrapping
        if (particle.x < 0) particle.x = dimensions.width
        if (particle.x > dimensions.width) particle.x = 0
        if (particle.y < 0) particle.y = dimensions.height
        if (particle.y > dimensions.height) particle.y = 0
        
        // Respawn dead particles
        if (particle.life <= 0) {
          Object.assign(particle, createParticle(dimensions.width, dimensions.height))
        }
        
        // Calculate alpha based on life
        const lifeRatio = particle.life / particle.maxLife
        const alpha = particle.alpha * lifeRatio
        
        // Draw particle
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = `${particle.color}${alpha})`
        ctx.fill()
        
        // Check for connections
        if (showConnections) {
          for (let j = i + 1; j < particles.length; j++) {
            const other = particles[j]
            const dx = particle.x - other.x
            const dy = particle.y - other.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            
            if (distance < 100) {
              connections.push({
                from: i,
                to: j,
                alpha: (1 - distance / 100) * 0.15
              })
            }
          }
        }
      })
      
      // Draw connections
      if (showConnections) {
        connections.forEach(({ from, to, alpha }) => {
          const p1 = particles[from]
          const p2 = particles[to]
          
          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.strokeStyle = `rgba(123, 97, 255, ${alpha})`
          ctx.lineWidth = 0.5
          ctx.stroke()
        })
      }
      
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [dimensions, showConnections, intensity])
  
  return (
    <div className={cn('fixed inset-0 pointer-events-none', className)}>
      {/* Canvas for particles */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0"
        style={{ opacity: 0.6 }}
      />
      
      {/* Glow orbs */}
      {showGlow && (
        <>
          <div 
            className="absolute w-[600px] h-[600px] rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, rgba(123, 97, 255, 0.3) 0%, transparent 70%)',
              top: '10%',
              left: '15%',
              animation: 'algo-breathe 8s ease-in-out infinite',
              filter: 'blur(60px)'
            }}
          />
          <div 
            className="absolute w-[500px] h-[500px] rounded-full opacity-15"
            style={{
              background: 'radial-gradient(circle, rgba(0, 209, 255, 0.3) 0%, transparent 70%)',
              bottom: '20%',
              right: '10%',
              animation: 'algo-breathe 10s ease-in-out infinite 2s',
              filter: 'blur(80px)'
            }}
          />
          <div 
            className="absolute w-[400px] h-[400px] rounded-full opacity-10"
            style={{
              background: 'radial-gradient(circle, rgba(0, 255, 178, 0.3) 0%, transparent 70%)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              animation: 'algo-breathe 12s ease-in-out infinite 4s',
              filter: 'blur(100px)'
            }}
          />
        </>
      )}
      
      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(123, 97, 255, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(123, 97, 255, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />
      
      {/* Scan line effect */}
      <div 
        className="absolute inset-0 overflow-hidden opacity-5"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(123, 97, 255, 0.1) 2px, rgba(123, 97, 255, 0.1) 4px)'
        }}
      />
    </div>
  )
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function createParticle(width: number, height: number): Particle {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)]
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    size: Math.random() * 2 + 0.5,
    color,
    alpha: Math.random() * 0.5 + 0.2,
    life: Math.random() * 300 + 200,
    maxLife: 500
  }
}

// ─── Minimal Background (for performance) ────────────────────────────────────

export function MinimalBackground({ className }: { className?: string }) {
  return (
    <div className={cn('fixed inset-0 pointer-events-none overflow-hidden', className)}>
      {/* Static gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#07070f] via-[#0a0a14] to-[#07070f]" />
      
      {/* Subtle glow spots */}
      <div 
        className="absolute w-[800px] h-[800px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(123, 97, 255, 0.08) 0%, transparent 60%)',
          top: '-200px',
          left: '-200px',
          filter: 'blur(80px)'
        }}
      />
      <div 
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(0, 209, 255, 0.06) 0%, transparent 60%)',
          bottom: '-100px',
          right: '-100px',
          filter: 'blur(100px)'
        }}
      />
      
      {/* Subtle grid */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px'
        }}
      />
    </div>
  )
}

// ─── Pulse Ring Animation ─────────────────────────────────────────────────────

interface PulseRingProps {
  x?: number
  y?: number
  color?: string
  size?: number
  duration?: number
}

export function PulseRing({
  x = 50,
  y = 50,
  color = 'rgba(123, 97, 255, 0.3)',
  size = 200,
  duration = 3
}: PulseRingProps) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        transform: 'translate(-50%, -50%)',
        border: `2px solid ${color}`,
        animation: `algo-wave ${duration}s ease-out infinite`,
        opacity: 0.5
      }}
    />
  )
}
