;

export function DashboardShell({ 
  children, 
  title, 
  subtitle,
  headerActions
}: { 
  children: React.ReactNode; 
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
}) {
  return (
    <div className="space-y-8">
      {(title || subtitle || headerActions) && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1 text-left">
            {title && <h1 className="text-3xl font-black tracking-tight text-[#0F172A] uppercase font-[family-name:var(--font-montserrat)]">{title}</h1>}
            {subtitle && <p className="text-muted-foreground font-medium">{subtitle}</p>}
          </div>
          {headerActions && <div className="flex items-center gap-3">{headerActions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
