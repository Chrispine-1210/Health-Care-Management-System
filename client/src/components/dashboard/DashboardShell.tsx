import type { ReactNode } from "react";

type DashboardShellProps = {
  role: string;
  title: string;
  description: string;
  meta?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
};

export function DashboardShell({
  role,
  title,
  description,
  meta,
  actions,
  children,
}: DashboardShellProps) {
  return (
    <section className="space-y-6">
      <header className="rounded-2xl border bg-gradient-to-br from-background via-muted/30 to-muted/60 p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">{role}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">{description}</p>
            {meta && <div className="mt-4 flex flex-wrap gap-2">{meta}</div>}
          </div>
          {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
        </div>
      </header>
      {children}
    </section>
  );
}
