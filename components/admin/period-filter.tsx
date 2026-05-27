"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const PERIOD_OPTIONS = [
  { label: "All Time", value: "0" },
  { label: "Past 12 Months", value: "12" },
  { label: "Past 6 Months", value: "6" },
  { label: "Past 3 Months", value: "3" },
  { label: "Past Month", value: "1" },
];

/**
 * Period filter dropdown for admin list pages. Reads/writes the `months`
 * URL search param; the server component reads that param to filter the query.
 */
export function PeriodFilter({ paramName = "months" }: { paramName?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const current = sp.get(paramName) ?? "0";

  return (
    <select
      value={current}
      onChange={(e) => {
        const params = new URLSearchParams(sp.toString());
        if (e.target.value === "0") params.delete(paramName);
        else params.set(paramName, e.target.value);
        const q = params.toString();
        router.push(q ? `${pathname}?${q}` : pathname);
      }}
      aria-label="Filter by time period"
      className="border border-line font-sans text-sm text-ink px-3 py-1.5 bg-white focus:outline-none focus:border-orange"
    >
      {PERIOD_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
