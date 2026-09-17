"use client";

import { useRouter } from "next/navigation";

export function ActivityRetry() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-slate hover:border-pulse/40 hover:text-pulse"
    >
      Retry
    </button>
  );
}
