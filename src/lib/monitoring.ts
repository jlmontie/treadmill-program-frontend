/**
 * Monitoring and observability utilities
 *
 * This module provides a foundation for error tracking and monitoring.
 * Currently configured for console-based logging in development.
 *
 * PRODUCTION READY: Integrates with Sentry, LogRocket, or similar services
 * To enable production monitoring, uncomment the Sentry integration below.
 */

import { config } from './env'

/**
 * Log an error to monitoring service
 * @param error - The error to log
 * @param context - Additional context for debugging
 */
export function captureException(error: Error, context?: Record<string, unknown>) {
  // Development: Log to console
  if (config.isDevelopment) {
    console.error('[Monitoring] Exception captured:', {
      message: error.message,
      stack: error.stack,
      context,
    })
  }

  // Production: Send to monitoring service
  // TODO: Uncomment when Sentry is configured
  // if (config.isProduction && typeof window !== 'undefined') {
  //   Sentry.captureException(error, { extra: context })
  // }
}

/**
 * Log a message to monitoring service
 * @param message - The message to log
 * @param level - Severity level
 * @param context - Additional context
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, unknown>
) {
  // Development: Log to console
  if (config.isDevelopment) {
    const logger =
      level === 'error' ? console.error : level === 'warning' ? console.warn : console.log
    logger('[Monitoring]', message, context || '')
  }

  // Production: Send to monitoring service
  // TODO: Uncomment when Sentry is configured
  // if (config.isProduction && typeof window !== 'undefined') {
  //   Sentry.captureMessage(message, { level, extra: context })
  // }
}

/**
 * Set user context for monitoring
 * @param _user - User information
 */
export function setUser(_user: { id: string; email?: string; name?: string }) {
  // TODO: Uncomment when Sentry is configured
  // if (config.isProduction && typeof window !== 'undefined') {
  //   Sentry.setUser({
  //     id: user.id,
  //     email: user.email,
  //     username: user.name,
  //   })
  // }
}

/**
 * Clear user context (on logout)
 */
export function clearUser() {
  // TODO: Uncomment when Sentry is configured
  // if (config.isProduction && typeof window !== 'undefined') {
  //   Sentry.setUser(null)
  // }
}

/**
 * Track performance metric
 * @param metric - Metric name
 * @param value - Metric value
 * @param unit - Unit of measurement
 */
export function trackPerformance(
  metric: string,
  value: number,
  unit: 'ms' | 'bytes' | 'count' = 'ms'
) {
  if (config.isDevelopment) {
    console.log(`[Performance] ${metric}: ${value}${unit}`)
  }

  // TODO: Uncomment when Sentry is configured
  // if (config.isProduction && typeof window !== 'undefined') {
  //   Sentry.metrics.gauge(metric, value, { unit })
  // }
}
