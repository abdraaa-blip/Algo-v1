'use client'

import { memo, useEffect, useRef, useState } from 'react'
import { motion, useInView, useAnimation, Variants } from 'framer-motion'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED TITLE - Letters appear one by one with bounce
// ─────────────────────────────────────────────────────────────────────────────

interface AnimatedTitleProps {
  text: string
  className?: string
  delay?: number
  staggerChildren?: number
}

const letterVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    rotateX: -90,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    rotateX: 0,
    transition: {
      type: 'spring',
      damping: 12,
      stiffness: 200,
    }
  },
}

export const AnimatedTitle = memo(function AnimatedTitle({ 
  text, 
  className,
  delay = 0,
  staggerChildren = 0.03,
}: AnimatedTitleProps) {
  const ref = useRef<HTMLHeadingElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const controls = useAnimation()
  
  useEffect(() => {
    if (isInView) {
      controls.start('visible')
    }
  }, [isInView, controls])
  
  const words = text.split(' ')
  
  return (
    <motion.h2
      ref={ref}
      className={cn('overflow-hidden', className)}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: {},
        visible: {
          transition: {
            delayChildren: delay,
            staggerChildren: staggerChildren,
          }
        }
      }}
    >
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block mr-[0.25em]">
          {word.split('').map((letter, letterIndex) => (
            <motion.span
              key={letterIndex}
              className="inline-block"
              variants={letterVariants}
              style={{ transformOrigin: 'bottom' }}
            >
              {letter}
            </motion.span>
          ))}
        </span>
      ))}
    </motion.h2>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// TYPING TEXT - Typewriter effect
// ─────────────────────────────────────────────────────────────────────────────

interface TypingTextProps {
  text: string
  className?: string
  speed?: number
  delay?: number
  cursor?: boolean
}

export const TypingText = memo(function TypingText({
  text,
  className,
  speed = 50,
  delay = 0,
  cursor = true,
}: TypingTextProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  
  useEffect(() => {
    if (!isInView) return
    
    const timeout = setTimeout(() => {
      setIsTyping(true)
      let currentIndex = 0
      
      const interval = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1))
          currentIndex++
        } else {
          clearInterval(interval)
          setIsTyping(false)
        }
      }, speed)
      
      return () => clearInterval(interval)
    }, delay)
    
    return () => clearTimeout(timeout)
  }, [isInView, text, speed, delay])
  
  return (
    <span ref={ref} className={className}>
      {displayedText}
      {cursor && (
        <motion.span
          className="inline-block w-[2px] h-[1em] bg-current ml-0.5 align-middle"
          animate={{ opacity: isTyping ? 1 : [1, 0] }}
          transition={{ 
            duration: 0.5, 
            repeat: isTyping ? 0 : Infinity,
            repeatType: 'reverse',
          }}
        />
      )}
    </span>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// FADE UP TEXT - Simple fade up on scroll
// ─────────────────────────────────────────────────────────────────────────────

interface FadeUpTextProps {
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  y?: number
}

export const FadeUpText = memo(function FadeUpText({
  children,
  className,
  delay = 0,
  duration = 0.6,
  y = 30,
}: FadeUpTextProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// SHIMMER TEXT - Text with moving gradient highlight
// ─────────────────────────────────────────────────────────────────────────────

interface ShimmerTextProps {
  text: string
  className?: string
  shimmerColor?: string
}

export const ShimmerText = memo(function ShimmerText({
  text,
  className,
  shimmerColor = 'rgba(255,255,255,0.4)',
}: ShimmerTextProps) {
  return (
    <span className={cn('relative inline-block', className)}>
      <span className="relative z-10">{text}</span>
      <motion.span
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${shimmerColor} 50%, transparent 100%)`,
          backgroundSize: '200% 100%',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
        animate={{
          backgroundPosition: ['200% 0', '-200% 0'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {text}
      </motion.span>
    </span>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// GLOW TEXT - Text with pulsing glow
// ─────────────────────────────────────────────────────────────────────────────

interface GlowTextProps {
  children: React.ReactNode
  className?: string
  glowColor?: string
  intensity?: 'low' | 'medium' | 'high'
}

const glowIntensity = {
  low: { blur: 10, spread: 5 },
  medium: { blur: 20, spread: 10 },
  high: { blur: 30, spread: 15 },
}

export const GlowText = memo(function GlowText({
  children,
  className,
  glowColor = 'rgba(139,92,246,0.6)',
  intensity = 'medium',
}: GlowTextProps) {
  const config = glowIntensity[intensity]
  
  return (
    <motion.span
      className={className}
      animate={{
        textShadow: [
          `0 0 ${config.blur}px ${glowColor}, 0 0 ${config.spread}px ${glowColor}`,
          `0 0 ${config.blur * 1.5}px ${glowColor}, 0 0 ${config.spread * 2}px ${glowColor}`,
          `0 0 ${config.blur}px ${glowColor}, 0 0 ${config.spread}px ${glowColor}`,
        ]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.span>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// COUNTING NUMBER - Animated counter
// ─────────────────────────────────────────────────────────────────────────────

interface CountingNumberProps {
  value: number
  className?: string
  duration?: number
  delay?: number
  prefix?: string
  suffix?: string
  decimals?: number
}

export const CountingNumber = memo(function CountingNumber({
  value,
  className,
  duration = 2,
  delay = 0,
  prefix = '',
  suffix = '',
  decimals = 0,
}: CountingNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  
  useEffect(() => {
    if (!isInView) return
    
    const timeout = setTimeout(() => {
      const startTime = Date.now()
      const startValue = 0
      
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / (duration * 1000), 1)
        
        // Easing function (ease-out cubic)
        const eased = 1 - Math.pow(1 - progress, 3)
        const current = startValue + (value - startValue) * eased
        
        setDisplayValue(current)
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      
      requestAnimationFrame(animate)
    }, delay * 1000)
    
    return () => clearTimeout(timeout)
  }, [isInView, value, duration, delay])
  
  return (
    <span ref={ref} className={className}>
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// WAVE TEXT - Letters wave up and down
// ─────────────────────────────────────────────────────────────────────────────

interface WaveTextProps {
  text: string
  className?: string
  amplitude?: number
  frequency?: number
}

export const WaveText = memo(function WaveText({
  text,
  className,
  amplitude = 5,
  frequency = 0.15,
}: WaveTextProps) {
  return (
    <span className={cn('inline-flex', className)}>
      {text.split('').map((letter, i) => (
        <motion.span
          key={i}
          className="inline-block"
          animate={{
            y: [0, -amplitude, 0, amplitude, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * frequency,
            ease: 'easeInOut',
          }}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </span>
  )
})
