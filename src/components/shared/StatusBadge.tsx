import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  label: string
  variant?: 'default' | 'signal' | 'success' | 'error' | 'dark'
  className?: string
}

const variantClasses = {
  default: 'border border-mech-ink-20 text-mech-ink-80',
  signal:  'border border-mech-orange text-mech-orange bg-[rgba(255,91,36,0.08)]',
  success: 'border border-mech-signal-green text-mech-signal-green bg-[rgba(46,204,113,0.08)]',
  error:   'border border-mech-signal-red text-mech-signal-red bg-[rgba(231,76,60,0.08)]',
  dark:    'border border-mech-dark bg-mech-dark text-mech-paper',
}

/** Square status badge following MECH DS badge pattern. Uppercase monospace text. */
export default function StatusBadge({ label, variant = 'default', className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 font-mono text-xs uppercase tracking-[0.08em] rounded-none',
        variantClasses[variant],
        className
      )}
    >
      {label}
    </span>
  )
}
