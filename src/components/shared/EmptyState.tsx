import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

/** Empty state with icon, message, and optional CTA. Used on all list/table pages when no data exists. */
export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-60 gap-3 py-10">
      <Icon size={32} strokeWidth={1.5} className="text-mech-ink-20" />
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="font-grotesk text-display-sm text-mech-ink-80">{title}</p>
        {description && (
          <p className="font-poppins text-body-md text-mech-ink-50 max-w-xs">{description}</p>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 bg-mech-orange text-white font-grotesk font-medium text-sm tracking-[0.01em] border-2 border-mech-orange rounded-none transition-colors duration-fast hover:opacity-90 active:opacity-80"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
