import { HelpCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface FieldTooltipProps {
  label: string
  tooltip?: string
  required?: boolean
}

/** Form field label with optional ? tooltip icon. Used on every form field to provide contextual help. */
export default function FieldTooltip({ label, tooltip, required }: FieldTooltipProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-grotesk font-medium text-xs uppercase tracking-[0.08em] text-mech-ink-80">
        {label}
        {required && <span className="text-mech-signal-red ml-0.5">*</span>}
      </span>
      {tooltip && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              type="button"
              className="inline-flex items-center text-mech-ink-50 hover:text-mech-ink-80 transition-colors duration-instant"
            >
              <HelpCircle size={14} strokeWidth={1.5} />
            </TooltipTrigger>
            <TooltipContent className="max-w-56 font-poppins text-xs bg-mech-dark text-mech-paper border-0 shadow-none">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
