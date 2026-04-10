'use client'

import { useState, useEffect } from 'react'
import { X, Keyboard } from 'lucide-react'
import { cn } from '@/lib/utils'

const SHORTCUTS = [
  { keys: ['H'], description: 'Aller a NOW' },
  { keys: ['T'], description: 'Aller aux Trends' },
  { keys: ['V'], description: 'Aller aux Videos' },
  { keys: ['N'], description: 'Aller aux News' },
  { keys: ['C'], description: 'Mode Createur' },
  { keys: ['S'], description: 'Rising Stars' },
  { keys: ['/'], description: 'Rechercher' },
  { keys: ['Esc'], description: 'Fermer / Annuler' },
  { keys: ['Shift', '?'], description: 'Afficher les raccourcis' },
]

export function ShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false)
  
  useEffect(() => {
    const handleShowShortcuts = () => setIsOpen(true)
    window.addEventListener('algo:show-shortcuts', handleShowShortcuts)
    return () => window.removeEventListener('algo:show-shortcuts', handleShowShortcuts)
  }, [])
  
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen])
  
  if (!isOpen) return null
  
  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      onClick={() => setIsOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      {/* Modal */}
      <div
        className="relative w-full max-w-md algo-modal-panel overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
              <Keyboard size={20} className="text-violet-400" />
            </div>
            <div>
              <h2 className="text-[var(--color-text-primary)] font-bold">Raccourcis clavier</h2>
              <p className="text-[var(--color-text-tertiary)] text-xs">Navigation rapide</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-[var(--color-card)] rounded-lg transition-colors"
          >
            <X size={20} className="text-[var(--color-text-tertiary)]" />
          </button>
        </div>
        
        {/* Shortcuts list */}
        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {SHORTCUTS.map((shortcut, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[var(--color-card)]"
            >
              <span className="text-sm text-[var(--color-text-secondary)]">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, j) => (
                  <span key={j}>
                    <kbd className={cn(
                      'px-2 py-1 rounded bg-[var(--color-card)] border border-[var(--color-border)]',
                      'text-xs font-mono text-[var(--color-text-secondary)]'
                    )}>
                      {key}
                    </kbd>
                    {j < shortcut.keys.length - 1 && (
                      <span className="text-[var(--color-text-muted)] mx-0.5">+</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-[var(--color-border)] text-center">
          <p className="text-xs text-[var(--color-text-muted)]">
            Appuyez sur <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-card)] border border-[var(--color-border)] font-mono">Esc</kbd> pour fermer
          </p>
        </div>
      </div>
    </div>
  )
}

export default ShortcutsModal
