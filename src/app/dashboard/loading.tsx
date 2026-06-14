/** Instant skeleton shown while an /admin page's data loads.  Renders
 *  inside the persistent AdminShell, so navigating between sections feels
 *  immediate (a structured placeholder, never a frozen blank screen). */

function Block({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-bg-soft ${className}`} />;
}

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      {/* Title row */}
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <Block className="h-7 w-44" />
          <Block className="h-4 w-60" />
        </div>
        <Block className="h-10 w-32" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-bg p-4">
            <Block className="h-9 w-9" />
            <Block className="mt-3 h-7 w-20" />
            <Block className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Wide panel */}
      <div className="rounded-2xl border border-border bg-bg p-5">
        <Block className="h-4 w-40" />
        <Block className="mt-4 h-40 w-full" />
      </div>

      {/* Two-column */}
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-2xl border border-border bg-bg p-5">
            <Block className="h-4 w-36" />
            {Array.from({ length: 4 }).map((_, j) => (
              <Block key={j} className="h-10 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
