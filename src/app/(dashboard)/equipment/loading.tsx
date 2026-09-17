import { PanelSkeleton } from "@/components/layout/panel-skeleton";
export default function Loading() {
  return (
    <div className="space-y-8 pb-8" aria-label="Loading equipment">
      <PanelSkeleton label="Loading equipment" />
      <PanelSkeleton label="Loading equipment table" />
    </div>
  );
}
