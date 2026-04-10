'use client'

import { type ReactNode, Suspense } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { OfflineBanner } from '@/components/ui/OfflineBanner'
import { LoadingProgress } from '@/components/ui/LoadingProgress'
import { KeyboardShortcuts } from '@/components/KeyboardShortcuts'
import { ShortcutsModal } from '@/components/ui/ShortcutsModal'
import { CommandPalette } from '@/components/ui/CommandPalette'
import { GlobalErrorHandler } from '@/components/GlobalErrorHandler'
import { AlgoSystemProvider } from '@/components/providers/AlgoSystemProvider'
import { ConsentBanner } from '@/components/growth/ConsentBanner'
import { AnalyticsConsentScripts } from '@/components/growth/AnalyticsConsentScripts'
import { PersonalizationProvider } from '@/components/growth/PersonalizationProvider'

interface ClientProvidersProps {
  children: ReactNode
}

/**
 * Client-side providers wrapper
 * Includes the ALGO nervous system, error boundaries, offline detection, and keyboard shortcuts
 */
export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ErrorBoundary>
      <AlgoSystemProvider>
        <PersonalizationProvider>
          <GlobalErrorHandler />
          <AnalyticsConsentScripts />
          <Suspense fallback={null}>
            <LoadingProgress />
          </Suspense>
          <OfflineBanner />
          <KeyboardShortcuts />
          <ShortcutsModal />
          <CommandPalette />
          <ConsentBanner />
          {/* ServiceWorkerRegister disabled temporarily to fix caching issues */}
          {children}
        </PersonalizationProvider>
      </AlgoSystemProvider>
    </ErrorBoundary>
  )
}
