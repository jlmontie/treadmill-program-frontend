/**
 * Shared form styling constants
 * 
 * These constants provide consistent styling across all form components
 * to avoid DRY violations with repeated className strings.
 */

/**
 * Standard dark theme input styling
 */
export const inputStyles = {
  base: 'bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20',
  
  /** For inputs inside forms with lighter background */
  light: 'bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20',
  
  /** Error state */
  error: 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
} as const

/**
 * Standard select/dropdown styling
 */
export const selectStyles = {
  trigger: 'bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500 focus:ring-cyan-500/20',
  content: 'bg-slate-800 border-slate-700',
  item: 'text-white focus:bg-slate-700 focus:text-white',
} as const

/**
 * Standard label styling
 */
export const labelStyles = {
  base: 'text-slate-300',
  required: 'text-slate-300 after:content-["*"] after:ml-0.5 after:text-red-400',
} as const

/**
 * Standard button styling variants
 */
export const buttonStyles = {
  /** Primary action button */
  primary: 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/25',
  
  /** Secondary/outline button */
  secondary: 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white',
  
  /** Destructive/cancel action */
  destructive: 'border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300',
  
  /** Ghost button for less prominent actions */
  ghost: 'text-slate-400 hover:text-white hover:bg-slate-800',
} as const

/**
 * Card/container styling
 */
export const cardStyles = {
  base: 'bg-slate-900/50 border-slate-800',
  interactive: 'bg-slate-800/50 hover:bg-slate-800 transition-colors',
} as const

/**
 * Badge color variants by status
 */
export const badgeStyles = {
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  neutral: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  
  /** Gender-specific */
  male: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  female: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
} as const

/**
 * Form section/group styling
 */
export const formSectionStyles = {
  grid2: 'grid gap-4 sm:grid-cols-2',
  grid3: 'grid gap-4 sm:grid-cols-3',
  stack: 'space-y-4',
} as const

/**
 * Helper to combine class names
 */
export function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}
