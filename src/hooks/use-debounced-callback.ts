import { useCallback, useRef, useEffect } from 'react'

/**
 * Creates a debounced version of a callback function.
 * The callback will only be invoked after `delay` milliseconds have passed
 * since the last call.
 * 
 * @param callback - The function to debounce
 * @param delay - The delay in milliseconds (default: 500)
 * @returns A debounced version of the callback
 * 
 * @example
 * ```tsx
 * const debouncedRefresh = useDebouncedCallback(() => {
 *   router.refresh()
 * }, 500)
 * 
 * // Call this on real-time updates - will only fire once per 500ms
 * debouncedRefresh()
 * ```
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef(callback)
  
  // Keep callback ref up to date using useEffect
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  return useCallback(
    (...args: Parameters<T>) => {
      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    },
    [delay]
  )
}
