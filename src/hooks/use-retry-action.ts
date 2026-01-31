'use client'

import { useState, useCallback, useTransition } from 'react'
import { toast } from 'sonner'
import { retryAction, type RetryOptions, type ActionResult } from '@/lib/retry'

interface UseRetryActionOptions extends RetryOptions {
  /** Toast message on success (optional) */
  successMessage?: string
  /** Toast message on error (optional, will use error message if not provided) */
  errorMessage?: string
  /** Show retry toast notifications */
  showRetryToasts?: boolean
}

interface UseRetryActionReturn<T> {
  /** Execute the action with retry */
  execute: (fn: () => Promise<ActionResult<T> | void>) => Promise<ActionResult<T>>
  /** Whether the action is currently pending */
  isPending: boolean
  /** Current retry attempt (0 if not retrying) */
  retryAttempt: number
  /** Last error message */
  error: string | null
  /** Reset error state */
  clearError: () => void
}

/**
 * Hook for executing server actions with automatic retry and toast feedback
 * 
 * @example
 * function SaveButton() {
 *   const { execute, isPending, retryAttempt } = useRetryAction({
 *     maxRetries: 3,
 *     successMessage: 'Saved successfully',
 *   })
 * 
 *   const handleSave = async () => {
 *     const result = await execute(() => saveData(formData))
 *     if ('success' in result) {
 *       router.push('/success')
 *     }
 *   }
 * 
 *   return (
 *     <Button onClick={handleSave} disabled={isPending}>
 *       {isPending ? (retryAttempt > 0 ? `Retrying (${retryAttempt})...` : 'Saving...') : 'Save'}
 *     </Button>
 *   )
 * }
 */
export function useRetryAction<T = unknown>(
  options: UseRetryActionOptions = {}
): UseRetryActionReturn<T> {
  const [isPending, startTransition] = useTransition()
  const [retryAttempt, setRetryAttempt] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const {
    successMessage,
    errorMessage,
    showRetryToasts = true,
    ...retryOptions
  } = options

  const clearError = useCallback(() => setError(null), [])

  const execute = useCallback(
    async (fn: () => Promise<ActionResult<T> | void>): Promise<ActionResult<T>> => {
      setError(null)
      setRetryAttempt(0)

      return new Promise((resolve) => {
        startTransition(async () => {
          const result = await retryAction(fn, {
            ...retryOptions,
            onRetry: (attempt, err) => {
              setRetryAttempt(attempt)
              if (showRetryToasts) {
                toast.loading(`Retrying... (attempt ${attempt})`, {
                  id: 'retry-toast',
                })
              }
              retryOptions.onRetry?.(attempt, err)
            },
          })

          // Dismiss retry toast if it was shown
          if (showRetryToasts) {
            toast.dismiss('retry-toast')
          }

          setRetryAttempt(0)

          if ('error' in result) {
            setError(result.error)
            toast.error(errorMessage || 'Operation failed', {
              description: result.error,
            })
          } else if (successMessage) {
            toast.success(successMessage)
          }

          resolve(result)
        })
      })
    },
    [retryOptions, successMessage, errorMessage, showRetryToasts]
  )

  return {
    execute,
    isPending,
    retryAttempt,
    error,
    clearError,
  }
}
