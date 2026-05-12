import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  loading?: boolean
}

/** Confirmation dialog for destructive actions (delete, archive). Uses shadcn Dialog with MECH DS styling. */
export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Delete',
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-mech-paper border border-mech-ink-20 rounded-none p-6">
        <DialogHeader>
          <DialogTitle className="font-grotesk text-display-sm text-mech-dark">
            {title}
          </DialogTitle>
          <DialogDescription className="font-poppins text-body-md text-mech-ink-50">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-transparent text-mech-dark font-grotesk font-medium text-sm border border-mech-ink-20 rounded-none transition-colors duration-fast hover:border-mech-dark disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-transparent text-mech-signal-red font-grotesk font-medium text-sm border border-mech-signal-red rounded-none transition-colors duration-fast hover:bg-mech-signal-red hover:text-white disabled:opacity-50"
          >
            {loading ? 'Working...' : confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
