import { Toaster as Sonner, type ToasterProps } from "sonner"

/** App toast provider using sonner. Always light theme for MECH DS. */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      style={
        {
          "--normal-bg":     "var(--popover)",
          "--normal-text":   "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "0px",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
