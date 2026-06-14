"use client";

import { useRouter } from "next/navigation";
import { Calendar, ChevronDown } from "lucide-react";
import { RANGE_LABELS, type DateRange } from "@/lib/analytics-shared";

export default function RangeSelect({ value }: { value: DateRange }) {
  const router = useRouter();
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted">
        <Calendar className="h-4 w-4" />
      </span>
      <select
        value={value}
        onChange={(e) => router.push(`/dashboard/analytics?range=${e.target.value}`)}
        className="appearance-none rounded-xl border border-border bg-bg py-2 pl-9 pr-9 text-sm font-semibold text-fg outline-none focus:border-brand-blue/50"
      >
        {(Object.keys(RANGE_LABELS) as DateRange[]).map((k) => (
          <option key={k} value={k}>{RANGE_LABELS[k]}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-faint" />
    </div>
  );
}
