import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type MetricTone = "neutral" | "pulse" | "warning" | "alert";

type MetricCardProps = {
  label: ReactNode;
  value: ReactNode;
  detail?: ReactNode;
  icon?: LucideIcon;
  tone?: MetricTone;
};

const toneClasses: Record<MetricTone, string> = {
  neutral: "border-line bg-paper/5 text-paper",
  pulse: "border-pulse/20 bg-pulse/5 text-pulse",
  warning: "border-amber-300/20 bg-amber-300/5 text-amber-300",
  alert: "border-alert/20 bg-alert/5 text-alert",
};

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "neutral",
}: MetricCardProps) {
  return (
    <article className="rounded-2xl border border-line bg-canvas-deep p-5 transition-colors hover:border-paper/25">
      {Icon && (
        <span className={`grid size-9 place-items-center rounded-lg border ${toneClasses[tone]}`}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
      )}
      <p className={`${Icon ? "mt-5" : ""} text-xs font-medium text-slate`}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-paper">
        {value}
      </p>
      {detail && <p className="mt-1 text-xs text-slate">{detail}</p>}
    </article>
  );
}
