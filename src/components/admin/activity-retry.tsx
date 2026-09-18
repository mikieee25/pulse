"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ActivityRetry() {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      size="sm"
      type="button"
      onClick={() => router.refresh()}
      className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-slate hover:border-pulse/40 hover:text-pulse"
    >
      Retry
    </Button>
  );
}
