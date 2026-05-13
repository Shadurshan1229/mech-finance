interface BudgetProgressBarProps {
  percentage: number
  status: 'on_track' | 'warning' | 'over'
  segments?: number
  height?: number
}

/**
 * Nothing OS style segmented progress bar for budget tracking.
 * Square segments (no border-radius), gap-0.5 between each.
 */
export default function BudgetProgressBar({
  percentage,
  status,
  segments = 40,
  height = 6,
}: BudgetProgressBarProps) {
  const isOver    = status === 'over'
  const isWarning = status === 'warning'
  const fillColor = isOver || isWarning ? '#E74C3C' : '#FF5B24'
  const filled    = isOver ? segments : Math.round((Math.min(percentage, 100) / 100) * segments)

  return (
    <div className="flex" style={{ gap: '2px' }}>
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${height}px`,
            background: i < filled ? fillColor : '#D4C8C2',
            borderRadius: 0,
          }}
        />
      ))}
    </div>
  )
}
