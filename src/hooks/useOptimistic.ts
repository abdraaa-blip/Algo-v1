'use client'

import { useState, useCallback, useRef } from 'react'

interface OptimisticUpdate<T> {
  id: string
  originalValue: T
  optimisticValue: T
  timestamp: number
}

interface UseOptimisticOptions<T> {
  /** Rollback delay in ms if action fails */
  rollbackDelay?: number
  /** Callback on successful update */
  onSuccess?: (value: T) => void
  /** Callback on failed update */
  onError?: (error: Error, originalValue: T) => void
}

/**
 * Hook for optimistic updates
 * Makes interactions feel instant while syncing in background
 */
export function useOptimistic<T>(
  initialValue: T,
  options: UseOptimisticOptions<T> = {}
) {
  const { rollbackDelay = 3000, onSuccess, onError } = options

  const [value, setValue] = useState<T>(initialValue)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const pendingUpdates = useRef<Map<string, OptimisticUpdate<T>>>(new Map())
  const updateIdCounter = useRef(0)

  const update = useCallback(
    async (
      optimisticValue: T,
      asyncAction: () => Promise<T>
    ) => {
      const updateId = `update-${++updateIdCounter.current}`
      const originalValue = value

      // Store pending update for potential rollback
      pendingUpdates.current.set(updateId, {
        id: updateId,
        originalValue,
        optimisticValue,
        timestamp: Date.now(),
      })

      // Apply optimistic update immediately
      setValue(optimisticValue)
      setIsPending(true)
      setError(null)

      try {
        // Execute async action
        const result = await asyncAction()
        
        // Update with server response
        setValue(result)
        pendingUpdates.current.delete(updateId)
        onSuccess?.(result)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Update failed')
        
        // Rollback after delay
        setTimeout(() => {
          const pending = pendingUpdates.current.get(updateId)
          if (pending) {
            setValue(pending.originalValue)
            pendingUpdates.current.delete(updateId)
          }
        }, rollbackDelay)

        setError(error)
        onError?.(error, originalValue)
      } finally {
        setIsPending(false)
      }
    },
    [value, rollbackDelay, onSuccess, onError]
  )

  const reset = useCallback(() => {
    // Rollback all pending updates
    const updates = Array.from(pendingUpdates.current.values())
    if (updates.length > 0) {
      const oldest = updates.sort((a, b) => a.timestamp - b.timestamp)[0]
      setValue(oldest.originalValue)
    }
    pendingUpdates.current.clear()
    setIsPending(false)
    setError(null)
  }, [])

  return {
    value,
    isPending,
    error,
    update,
    reset,
    setValue,
  }
}

/**
 * Hook for optimistic list updates (add, remove, update items)
 */
export function useOptimisticList<T extends { id: string }>(
  initialItems: T[] = []
) {
  const [items, setItems] = useState<T[]>(initialItems)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())

  const addItem = useCallback(
    async (item: T, asyncAction?: () => Promise<T>) => {
      // Optimistically add
      setItems(prev => [...prev, item])
      setPendingIds(prev => new Set(prev).add(item.id))

      if (asyncAction) {
        try {
          const result = await asyncAction()
          setItems(prev => prev.map(i => (i.id === item.id ? result : i)))
        } catch {
          // Rollback
          setItems(prev => prev.filter(i => i.id !== item.id))
        } finally {
          setPendingIds(prev => {
            const next = new Set(prev)
            next.delete(item.id)
            return next
          })
        }
      }
    },
    []
  )

  const removeItem = useCallback(
    async (id: string, asyncAction?: () => Promise<void>) => {
      const originalItems = items
      
      // Optimistically remove
      setItems(prev => prev.filter(i => i.id !== id))
      setPendingIds(prev => new Set(prev).add(id))

      if (asyncAction) {
        try {
          await asyncAction()
        } catch {
          // Rollback
          setItems(originalItems)
        } finally {
          setPendingIds(prev => {
            const next = new Set(prev)
            next.delete(id)
            return next
          })
        }
      }
    },
    [items]
  )

  const updateItem = useCallback(
    async (id: string, updates: Partial<T>, asyncAction?: () => Promise<T>) => {
      const originalItem = items.find(i => i.id === id)
      if (!originalItem) return

      // Optimistically update
      setItems(prev =>
        prev.map(i => (i.id === id ? { ...i, ...updates } : i))
      )
      setPendingIds(prev => new Set(prev).add(id))

      if (asyncAction) {
        try {
          const result = await asyncAction()
          setItems(prev => prev.map(i => (i.id === id ? result : i)))
        } catch {
          // Rollback
          setItems(prev =>
            prev.map(i => (i.id === id ? originalItem : i))
          )
        } finally {
          setPendingIds(prev => {
            const next = new Set(prev)
            next.delete(id)
            return next
          })
        }
      }
    },
    [items]
  )

  return {
    items,
    setItems,
    addItem,
    removeItem,
    updateItem,
    isPending: (id: string) => pendingIds.has(id),
    hasPendingChanges: pendingIds.size > 0,
  }
}

/**
 * Hook for optimistic toggle (like/unlike, follow/unfollow, etc.)
 */
export function useOptimisticToggle(
  initialValue: boolean,
  asyncAction: (newValue: boolean) => Promise<boolean>
) {
  const [value, setValue] = useState(initialValue)
  const [isPending, setIsPending] = useState(false)

  const toggle = useCallback(async () => {
    const newValue = !value
    
    // Optimistic update
    setValue(newValue)
    setIsPending(true)

    try {
      const result = await asyncAction(newValue)
      setValue(result)
    } catch {
      // Rollback
      setValue(!newValue)
    } finally {
      setIsPending(false)
    }
  }, [value, asyncAction])

  return { value, toggle, isPending }
}
