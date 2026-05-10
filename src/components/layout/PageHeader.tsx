/** Reusable page header with title and optional breadcrumb. */

interface Crumb {
  label: string
  path?: string
}

interface PageHeaderProps {
  title: string
  breadcrumbs?: Crumb[]
  actions?: React.ReactNode
}

export default function PageHeader({ title, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div className="flex flex-col gap-1">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && (
                  <span className="font-mono text-xs text-mech-ink-20">›</span>
                )}
                <span className="font-mono text-xs uppercase tracking-[0.10em] text-mech-ink-50">
                  {crumb.label}
                </span>
              </span>
            ))}
          </nav>
        )}
        <h1 className="font-grotesk text-display-xl text-mech-dark tracking-[-0.01em]">
          {title}
        </h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
