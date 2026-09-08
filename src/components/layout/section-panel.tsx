import { cn } from "cn";
import type { ReactNode } from "react";

type SectionPanelProps = {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function SectionPanel({
  title,
  description,
  actions,
  children,
  className,
}: SectionPanelProps) {
  return (
    <section className={cn("overflow-hidden rounded-2xl border border-line bg-canvas-deep shadow-xl shadow-black/5", className)}>
      {(title || description || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            {title && <h2 className="font-serif text-xl text-paper">{title}</h2>}
            {description && <p className="mt-1 text-xs text-slate">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
