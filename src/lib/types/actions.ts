/**
 * Standardized action result types for server actions
 * 
 * This provides consistent error handling across all server actions.
 */

/**
 * Standard result type for server actions
 * @template T - The data type returned on success (defaults to void)
 */
export type ActionResult<T = void> = 
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

/**
 * Helper to create a success result
 */
export function success<T>(data: T): ActionResult<T> {
  return { success: true, data }
}

/**
 * Helper to create a success result with no data
 */
export function successVoid(): ActionResult<void> {
  return { success: true, data: undefined }
}

/**
 * Helper to create an error result
 */
export function failure(error: string, fieldErrors?: Record<string, string[]>): ActionResult<never> {
  return { success: false, error, fieldErrors }
}
