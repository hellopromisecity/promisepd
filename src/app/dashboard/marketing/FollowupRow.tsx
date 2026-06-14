"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Badge, tdCls } from "@/components/admin/ui";
import { updateFollowup, deleteFollowup } from "@/app/actions/admin-marketing";
import { confirmDialog } from "@/components/ui/Dialog";
import { STATUS_META, FOLLOWUP_STATUSES, type FollowupStatus } from "./status";
import type { StaffOption } from "./AddFollowupForm";

export type FollowupRowData = {
  id: string;
  client_name: string;
  mobile: string | null;
  interest: string | null;
  status: string;
  next_followup: string | null;
  assigned_to: string | null;
};

function isStatus(v: string): v is FollowupStatus {
  return (FOLLOWUP_STATUSES as readonly string[]).includes(v);
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const cellInput =
  "rounded-lg border border-border bg-bg-soft px-2 py-1 text-sm outline-none focus:border-brand-blue/50";

/** One follow-up row.  When `editable`, status / next_followup / assignment
 *  become inline controls that call updateFollowup and refresh on success. */
export default function FollowupRow({
  row,
  staff,
  editable,
  canDelete = false,
}: {
  row: FollowupRowData;
  staff: StaffOption[];
  editable: boolean;
  canDelete?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    const ok = await confirmDialog({ title: "Delete follow-up", message: `Delete the follow-up for “${row.client_name}”?`, confirmText: "Delete", danger: true });
    if (!ok) return;
    setError(null);
    startDelete(async () => {
      const res = await deleteFollowup(row.id);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  // Local optimistic mirror so the controls reflect the chosen value.
  const [status, setStatus] = useState(row.status);
  const [nextDate, setNextDate] = useState(row.next_followup ?? "");
  const [assigned, setAssigned] = useState(row.assigned_to ?? "");

  function persist(patch: {
    status?: string;
    next_followup?: string | null;
    assigned_to?: string | null;
  }) {
    setError(null);
    start(async () => {
      const res = await updateFollowup(row.id, patch);
      if (res.ok) {
        router.refresh();
      } else {
        setError(res.error);
        // Roll local state back to the server-known values.
        setStatus(row.status);
        setNextDate(row.next_followup ?? "");
        setAssigned(row.assigned_to ?? "");
      }
    });
  }

  const statusMeta = isStatus(status) ? STATUS_META[status] : null;
  const assignedName = staff.find((s) => s.id === (row.assigned_to ?? ""))?.name;

  return (
    <tr className={pending ? "opacity-60" : undefined}>
      <td className={tdCls}>
        <div className="font-semibold text-fg">{row.client_name}</div>
        {error && <div className="mt-0.5 text-[11px] text-brand-red-dark">{error}</div>}
      </td>
      <td className={tdCls}>
        {row.mobile ? (
          <a href={`tel:${row.mobile}`} className="text-fg hover:text-brand-blue">
            {row.mobile}
          </a>
        ) : (
          <span className="text-fg-faint">—</span>
        )}
      </td>
      <td className={tdCls}>
        {row.interest || <span className="text-fg-faint">—</span>}
      </td>

      {/* Status */}
      <td className={tdCls}>
        {editable ? (
          <select
            aria-label="Status"
            value={status}
            disabled={pending}
            onChange={(e) => {
              setStatus(e.target.value);
              persist({ status: e.target.value });
            }}
            className={cellInput}
          >
            {FOLLOWUP_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>
        ) : statusMeta ? (
          <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
        ) : (
          <Badge>{status}</Badge>
        )}
      </td>

      {/* Next follow-up */}
      <td className={tdCls}>
        {editable ? (
          <input
            aria-label="Next follow-up date"
            type="date"
            value={nextDate}
            disabled={pending}
            onChange={(e) => {
              setNextDate(e.target.value);
              persist({ next_followup: e.target.value || null });
            }}
            className={cellInput}
          />
        ) : row.next_followup ? (
          fmtDate(row.next_followup)
        ) : (
          <span className="text-fg-faint">—</span>
        )}
      </td>

      {/* Assigned to */}
      <td className={tdCls}>
        {editable ? (
          <select
            aria-label="Assigned to"
            value={assigned}
            disabled={pending}
            onChange={(e) => {
              setAssigned(e.target.value);
              persist({ assigned_to: e.target.value || null });
            }}
            className={cellInput}
          >
            <option value="">Unassigned</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        ) : assignedName ? (
          <span className="inline-flex items-center gap-1.5">
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin text-fg-faint" />}
            {assignedName}
          </span>
        ) : (
          <span className="text-fg-faint">Unassigned</span>
        )}
      </td>

      <td className={`${tdCls} text-right`}>
        {canDelete && (
          <button onClick={onDelete} disabled={deleting} aria-label="Delete follow-up" className="rounded-md p-1.5 text-fg-faint hover:bg-brand-red-tint hover:text-brand-red disabled:opacity-50">
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </button>
        )}
      </td>
    </tr>
  );
}
