/** Consistent page header with title, optional description, breadcrumb, and action slot. */

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumb?: string[]
  actions?: React.ReactNode
}

export default function PageHeader({ title, description, breadcrumb, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div className="flex flex-col gap-1">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="flex items-center gap-1.5">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && (
                  <span className="font-mono text-xs text-mech-ink-20">›</span>
                )}
                <span className="font-mono text-xs uppercase tracking-[0.12em] text-mech-ink-50">
                  {crumb}
                </span>
              </span>
            ))}
          </nav>
        )}
        <h1 className="font-grotesk text-display-xl text-mech-dark tracking-[-0.01em]">
          {title}
        </h1>
        {description && (
          <p className="font-poppins text-body-md text-mech-ink-50 mt-0.5">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0 mt-1">{actions}</div>}
    </div>
  )
}
