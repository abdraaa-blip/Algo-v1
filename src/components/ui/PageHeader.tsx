'use client'

import { BackButton } from './BackButton'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  showBack?: boolean
  backHref?: string
  action?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

export function PageHeader({
  title,
  subtitle,
  icon,
  showBack = true,
  backHref = '/',
  action,
  className,
  children
}: PageHeaderProps) {
  return (
    <header className={cn('space-y-4 mb-6', className)}>
      {/* Back button row */}
      {showBack && (
        <div className="flex items-center justify-between">
          <BackButton fallbackHref={backHref} />
          {action}
        </div>
      )}
      
      {/* Title row */}
      <div className="flex items-center gap-3">
        {icon && (
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-[#00D1FF]/20 border border-violet-500/20">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-white/50 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      
      {children}
    </header>
  )
}
