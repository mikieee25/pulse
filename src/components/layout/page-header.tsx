import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
}: PageHeaderProps) {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-line bg-canvas-deep p-6 shadow-2xl shadow-black/10 sm:p-8">
      <div
        className="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full bg-pulse/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
        <div className="max-w-2xl">
          {eyebrow && (
            <div className="mb-4 inline-flex items-center rounded-full border border-pulse/20 bg-pulse/10 px-3 py-1 text-xs font-medium text-pulse">
              {eyebrow}
            </div>
          )}
          <h1 className="font-serif text-3xl tracking-tight text-paper sm:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate">
              {description}
            </p>
          )}
          {children}
        </div>
        {actions && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center [&_*]:focus-visible:outline-none [&_*]:focus-visible:ring-2 [&_*]:focus-visible:ring-pulse/40">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
