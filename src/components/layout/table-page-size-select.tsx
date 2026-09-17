"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const DEFAULT_OPTIONS = [10, 25, 50];

export function TablePageSizeSelect({
  value,
  onChange,
  name,
  options = DEFAULT_OPTIONS,
}: {
  value: number;
  onChange?: (value: number) => void;
  name?: string;
  options?: number[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  return (
    <label className="inline-flex items-center gap-2 text-xs text-slate">
      <span>Show</span>
      <select
        name={name}
        value={value}
        aria-label="Rows per table"
        onChange={(event) => {
          const nextValue = Number(event.target.value);
          onChange?.(nextValue);
          if (!onChange) {
            const next = new URLSearchParams(searchParams.toString());
            next.set(name || "pageSize", String(nextValue));
            next.delete("page");
            const query = next.toString();
            startTransition(() =>
              router.replace(query ? `${pathname}?${query}` : pathname, {
                scroll: false,
              })
            );
          }
        }}
        className="h-9 rounded-lg border border-line bg-canvas-deep px-2 text-sm font-medium text-paper outline-none transition focus:border-pulse focus:ring-2 focus:ring-pulse/15"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span>rows</span>
    </label>
  );
}
