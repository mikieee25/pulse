import { PanelSkeleton } from "@/components/layout/panel-skeleton";
export default function Loading() {
  return (
    <div className="space-y-8 pb-8" aria-label="Loading budget">
      <PanelSkeleton label="Loading budget forecast" />
      <PanelSkeleton label="Loading replacement grid" />
    </div>
  );
}
