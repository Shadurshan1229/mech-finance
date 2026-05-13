import { Switch as SwitchPrimitive } from '@base-ui/react/switch'
import { cn } from '@/lib/utils'

/** MECH DS toggle switch — rounded track, square-ish thumb. Only allowed rounded component. */
function Switch({
  className,
  ...props
}: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full border border-mech-ink-20 bg-mech-ink-20 transition-colors duration-fast',
        'data-[checked]:bg-mech-dark data-[checked]:border-mech-dark',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mech-orange',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none block h-3.5 w-3.5 rounded-sm bg-mech-paper shadow-none transition-transform duration-fast',
          'translate-x-0.5 data-[checked]:translate-x-[18px]'
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
