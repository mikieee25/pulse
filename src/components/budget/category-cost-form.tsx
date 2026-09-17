"use client";

import { useActionState } from "react";
import { saveCategoryCost, type CategoryCostState } from "@/app/actions/admin";

const initialState: CategoryCostState = { error: "", success: false };

export function CategoryCostForm({
  categoryId,
  year,
  unitCost,
  categoryName,
  lifespanYears,
}: {
  categoryId: string;
  year: number;
  unitCost?: number;
  categoryName: string;
  lifespanYears: number | null;
}) {
  const [state, action, pending] = useActionState(
    saveCategoryCost,
    initialState
  );

  return (
    <form
      action={action}
      className="rounded-xl border border-line bg-canvas/60 p-3 transition-colors focus-within:border-pulse/50"
    >
      <input type="hidden" name="category_id" value={categoryId} />
      <input type="hidden" name="year" value={year} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <label
            htmlFor={`cost-${categoryId}`}
            className="block truncate text-xs font-semibold text-paper"
          >
            {categoryName}
          </label>
          <span className="mt-0.5 block text-[10px] text-slate">
            {lifespanYears === null
              ? "Manual replacement"
              : `${lifespanYears}-year lifecycle`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!unitCost && (
            <span className="shrink-0 rounded-full bg-warning/10 px-2 py-0.5 text-[9px] font-medium text-warning">
              Unpriced
            </span>
          )}
          {state.success && (
            <span
              role="status"
              className="shrink-0 text-xs font-medium text-pulse"
            >
              Saved.
            </span>
          )}
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-slate">
            ₱
          </span>
          <input
            id={`cost-${categoryId}`}
            aria-label={`Set ${categoryName} unit cost`}
            name="unit_cost"
            type="number"
            min="0"
            defaultValue={unitCost || ""}
            placeholder="0"
            className="h-9 w-full rounded-lg border border-line bg-canvas-deep pl-7 pr-2 text-right text-xs tabular-nums text-paper outline-none transition focus:border-pulse focus:ring-2 focus:ring-pulse/15"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="h-9 rounded-lg border border-line bg-canvas px-3 text-xs font-semibold text-paper transition hover:border-pulse/40 hover:text-pulse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse/40 disabled:pointer-events-none disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
      {state.error && (
        <p role="alert" className="mt-2 text-xs text-alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
