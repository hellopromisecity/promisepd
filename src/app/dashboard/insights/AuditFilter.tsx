"use client";

/** Action + entity filter for the audit log.  Navigates with ?action=
 *  / ?entity= query params (the page reads them from searchParams) and
 *  preserves whichever filter isn't being changed. */

import { useRouter } from "next/navigation";
import { Filter, X } from "lucide-react";

const selCls =
  "rounded-xl border border-border bg-bg-soft px-3 py-2 text-sm capitalize outline-none focus:border-brand-blue/50";

export default function AuditFilter({
  actions,
  entities,
  action,
  entity,
}: {
  actions: string[];
  entities: string[];
  action: string;
  entity: string;
}) {
  const router = useRouter();

  function navigate(next: { action?: string; entity?: string }) {
    const params = new URLSearchParams();
    const a = next.action ?? action;
    const e = next.entity ?? entity;
    if (a) params.set("action", a);
    if (e) params.set("entity", e);
    const qs = params.toString();
    router.push(qs ? `/dashboard/insights/audit?${qs}` : "/dashboard/insights/audit");
  }

  const hasFilter = Boolean(action || entity);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-sm font-semibold text-fg-muted">
        <Filter className="h-4 w-4" /> Filter
      </span>

      <label className="sr-only" htmlFor="audit-action">
        Filter by action
      </label>
      <select
        id="audit-action"
        value={action}
        onChange={(e) => navigate({ action: e.target.value })}
        className={selCls}
      >
        <option value="">All actions</option>
        {actions.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor="audit-entity">
        Filter by entity
      </label>
      <select
        id="audit-entity"
        value={entity}
        onChange={(e) => navigate({ entity: e.target.value })}
        className={selCls}
      >
        <option value="">All entities</option>
        {entities.map((en) => (
          <option key={en} value={en}>
            {en.replace(/_/g, " ")}
          </option>
        ))}
      </select>

      {hasFilter && (
        <button
          type="button"
          onClick={() => router.push("/dashboard/insights/audit")}
          className="inline-flex items-center gap-1 rounded-xl border border-border bg-bg px-3 py-2 text-sm font-semibold text-fg-muted transition-colors hover:border-brand-blue/40 hover:text-brand-blue"
        >
          <X className="h-3.5 w-3.5" /> Clear
        </button>
      )}
    </div>
  );
}
