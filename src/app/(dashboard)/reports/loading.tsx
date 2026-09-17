import { PanelSkeleton } from "@/components/layout/panel-skeleton";
export default function Loading() {
  return (
    <div className="space-y-8 pb-8" aria-label="Loading reports">
      <PanelSkeleton label="Loading report" />
      <PanelSkeleton label="Loading report table" />
    </div>
  );
}
