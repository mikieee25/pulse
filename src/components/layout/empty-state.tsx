import { PackageOpen } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: LucideIcon;
};

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = PackageOpen,
}: EmptyStateProps) {
  return (
    <div className="grid min-h-56 place-items-center p-8 text-center">
      <div>
        <Icon className="mx-auto size-8 text-slate" aria-hidden="true" />
        <p className="mt-3 text-sm font-medium text-paper">{title}</p>
        {description && <p className="mt-1 text-xs text-slate">{description}</p>}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}
