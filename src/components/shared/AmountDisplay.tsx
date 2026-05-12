import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'

interface AmountDisplayProps {
  amount: number
  showSign?: boolean
  type?: 'income' | 'expense' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'text-mono-sm',
  md: 'text-mono-md',
  lg: 'text-mono-lg',
}

const colorClasses = {
  income:  'text-mech-signal-green',
  expense: 'text-mech-signal-red',
  neutral: 'text-mech-dark',
}

/** Displays a formatted LKR amount in JetBrains Mono. Income = green, expense = red, neutral = dark. */
export default function AmountDisplay({
  amount,
  showSign = false,
  type = 'neutral',
  size = 'md',
  className,
}: AmountDisplayProps) {
  const sign = showSign ? (type === 'income' ? '+' : type === 'expense' ? '-' : '') : ''
  const absAmount = Math.abs(amount)

  return (
    <span
      data-amount
      className={cn('font-mono tabular-nums', sizeClasses[size], colorClasses[type], className)}
    >
      {sign}{formatCurrency(absAmount)}
    </span>
  )
}
