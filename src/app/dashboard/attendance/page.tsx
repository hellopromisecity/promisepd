import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck, Clock, UserX, CalendarDays, Upload } from "lucide-react";
import { getCurrentUser, isManager, isStaff } from "@/lib/auth";
import { getAdmin } from "@/lib/admin-guard";
import {
  PageHeader,
  Card,
  StatCard,
  Badge,
  EmptyState,
  TableShell,
  thCls,
  tdCls,
  type Tone,
} from "@/components/admin/ui";
import { buildStaffDirectory, refForMember, type StaffAccount } from "@/lib/staff-directory";
import SelfCheck from "./SelfCheck";
import AttendanceControls from "./AttendanceControls";
import AttendanceRoster, { type RosterRow } from "./AttendanceRoster";

export const dynamic = "force-dynamic";

type AttendanceStatus = "present" | "late" | "absent" | "leave" | "holiday";
type MarkStatus = "present" | "late" | "absent" | "leave";

const STATUS_TONE: Record<AttendanceStatus, Tone> = {
  present: "success",
  late: "warning",
  absent: "danger",
  leave: "info",
  holiday: "neutral",
};

/** Local YYYY-MM-DD for "today" (matches the self check-in action). */
function todayStr(): string {
  return new Date().toLocaleDateString("en-CA");
}

const isoDate = (d: Date) => d.toLocaleDateString("en-CA");

/** Resolve a range preset id (or custom from/to) to a {from, to} window. */
function resolveRange(
  id: string,
  from: string,
  to: string,
  today: string,
): { from: string; to: string; label: string } {
  const t = new Date(`${today}T00:00:00`);
  const y = t.getFullYear();
  const back = (n: number) => {
    const c = new Date(t);
    c.setDate(c.getDate() - n);
    return isoDate(c);
  };
  switch (id) {
    case "last7": return { from: back(6), to: today, label: "Last 7 days" };
    case "last30": return { from: back(29), to: today, label: "Last 30 days" };
    case "this_month": return { from: isoDate(new Date(y, t.getMonth(), 1)), to: today, label: "This month" };
    case "last_month": return { from: isoDate(new Date(y, t.getMonth() - 1, 1)), to: isoDate(new Date(y, t.getMonth(), 0)), label: "Last month" };
    case "this_year": return { from: `${y}-01-01`, to: today, label: "This year" };
    case "last_year": return { from: `${y - 1}-01-01`, to: `${y - 1}-12-31`, label: "Last year" };
    case "custom": {
      const f = /^\d{4}-\d{2}-\d{2}$/.test(from) ? from : today;
      const tt = /^\d{4}-\d{2}-\d{2}$/.test(to) ? to : today;
      return f <= tt ? { from: f, to: tt, label: "Custom range" } : { from: tt, to: f, label: "Custom range" };
    }
    default: return { from: isoDate(new Date(y, t.getMonth(), 1)), to: today, label: "This month" };
  }
}

function fmtDate(d: string | null): string {
  if (!d) return "—";
  // Parse a bare YYYY-MM-DD as LOCAL midnight (matches todayStr /
  // resolveRange) so the rendered day never shifts under a non-UTC
  // server or locale.
  const s = d.includes("T") ? d : `${d}T00:00:00`;
  return new Date(s).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; range?: string; from?: string; to?: string }>;
}) {
  const me = await getCurrentUser();
  if (!me || !isStaff(me.role)) redirect("/account");

  const today = todayStr();
  const sp = await searchParams;
  const admin = getAdmin();

  if (!admin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Attendance" subtitle={fmtDate(today)} />
        <EmptyState
          icon={CalendarCheck}
          title="Data unavailable"
          message="Supabase isn't configured."
        />
      </div>
    );
  }

  // ----- Manager / admin -----
  if (isManager(me.role)) {
    // Full company directory (roster + accounts).  `employee_code` only
    // exists after migration 0016 — fall back so this never errors out.
    const selProfiles = (cols: string) =>
      admin.from("profiles").select(cols).order("name", { ascending: true });
    let pres = await selProfiles("id, name, mobile, role, employee_code");
    if (pres.error?.code === "42703") pres = await selProfiles("id, name, mobile, role");
    const accounts = (pres.error ? [] : pres.data ?? []) as unknown as StaffAccount[];
    const directory = buildStaffDirectory(accounts);

    const importLink = (
      <Link
        href="/dashboard/attendance/import"
        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg px-3 py-2 text-sm font-semibold text-brand-blue hover:bg-brand-blue-tint"
      >
        <Upload className="h-4 w-4" /> Import (ZKTeco)
      </Link>
    );

    // ===== RANGE mode: read-only per-employee summary =====
    if (sp.range) {
      const { from, to, label } = resolveRange(sp.range, sp.from ?? "", sp.to ?? "", today);
      const { data: rangeRows } = await admin
        .from("attendance")
        .select("staff_ref, status")
        .gte("date", from)
        .lte("date", to);
      const agg = new Map<string, { present: number; late: number; absent: number; leave: number }>();
      for (const r of (rangeRows ?? []) as { staff_ref: string | null; status: string }[]) {
        const k = r.staff_ref ?? "";
        if (!k) continue;
        const a = agg.get(k) ?? { present: 0, late: 0, absent: 0, leave: 0 };
        if (r.status === "present") a.present++;
        else if (r.status === "late") a.late++;
        else if (r.status === "absent") a.absent++;
        else if (r.status === "leave") a.leave++;
        agg.set(k, a);
      }

      return (
        <div className="space-y-5">
          <PageHeader title="Attendance" subtitle={`Summary · ${label} (${fmtDate(from)} – ${fmtDate(to)})`} action={importLink} />
          <AttendanceControls mode="range" rangeId={sp.range} from={from} to={to} />
          {directory.length === 0 ? (
            <EmptyState icon={CalendarCheck} title="No staff yet" message="Employees will appear here." />
          ) : (
            <TableShell>
              <thead>
                <tr>
                  <th className={thCls}>Employee</th>
                  <th className={thCls}>Present</th>
                  <th className={thCls}>Late</th>
                  <th className={thCls}>Absent</th>
                  <th className={thCls}>Leave</th>
                  <th className={thCls}>Marked</th>
                </tr>
              </thead>
              <tbody>
                {directory.map((d) => {
                  const a = agg.get(d.ref) ?? { present: 0, late: 0, absent: 0, leave: 0 };
                  const marked = a.present + a.late + a.absent + a.leave;
                  const meta = [d.designation, d.district].filter(Boolean).join(" · ") || d.mobile;
                  return (
                    <tr key={d.ref}>
                      <td className={tdCls}>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-fg">{d.name || "Unnamed"}</p>
                          <p className="truncate text-xs text-fg-muted">{meta}{d.code ? ` · ${d.code}` : ""}</p>
                        </div>
                      </td>
                      <td className={`${tdCls} font-semibold text-emerald-600`}>{a.present}</td>
                      <td className={`${tdCls} text-amber-600`}>{a.late}</td>
                      <td className={`${tdCls} text-brand-red`}>{a.absent}</td>
                      <td className={`${tdCls} text-brand-blue`}>{a.leave}</td>
                      <td className={`${tdCls} text-fg-muted`}>{marked}</td>
                    </tr>
                  );
                })}
              </tbody>
            </TableShell>
          )}
        </div>
      );
    }

    // ===== DAY mode: one-click bulk-marking roster =====
    const selDate =
      sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) && sp.date <= today ? sp.date : today;
    const { data: dayRows } = await admin
      .from("attendance")
      .select("staff_ref, status")
      .eq("date", selDate);
    const byRef = new Map(
      (dayRows ?? []).map((r) => [(r as { staff_ref: string | null }).staff_ref ?? "", (r as { status: string }).status]),
    );

    const rosterRows: RosterRow[] = directory.map((d) => {
      const raw = byRef.get(d.ref);
      const status: MarkStatus | null =
        raw === "present" || raw === "absent" || raw === "late" || raw === "leave" ? raw : null;
      return {
        ref: d.ref,
        memberId: d.account?.id ?? null,
        name: d.name,
        meta: [d.designation, d.district].filter(Boolean).join(" · ") || d.mobile,
        code: d.code,
        status,
      };
    });

    return (
      <div className="space-y-5">
        <PageHeader
          title="Attendance"
          subtitle={`Mark hajira · ${fmtDate(selDate)}${selDate === today ? " (today)" : ""}`}
          action={importLink}
        />
        <AttendanceControls mode="day" date={selDate} />
        {directory.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="No staff yet"
            message="Employees from the roster and registered accounts will appear here."
          />
        ) : (
          <AttendanceRoster date={selDate} rows={rosterRows} />
        )}
      </div>
    );
  }

  // ----- Plain staff: their own recent attendance + self check-in/out -----
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceStr = since.toLocaleDateString("en-CA");

  const myRef = refForMember({ id: me.id, mobile: me.mobile });
  const { data: mine } = await admin
    .from("attendance")
    .select("id, date, check_in, check_out, status, note")
    .eq("staff_ref", myRef)
    .gte("date", sinceStr)
    .order("date", { ascending: false });

  const myRows = mine ?? [];
  const todayRow = myRows.find((r) => r.date === today) ?? null;

  const present = myRows.filter((r) => r.status === "present").length;
  const late = myRows.filter((r) => r.status === "late").length;
  const absent = myRows.filter((r) => r.status === "absent").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" subtitle={`Your record · ${fmtDate(today)}`} />

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Present" value={present} sub="last 30 days" icon={CalendarCheck} tone="success" />
        <StatCard label="Late" value={late} sub="last 30 days" icon={Clock} tone="warning" />
        <StatCard label="Absent" value={absent} sub="last 30 days" icon={UserX} tone="danger" />
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-fg">Today</p>
            <p className="mt-0.5 text-xs text-fg-muted">
              Checked in {fmtTime(todayRow?.check_in ?? null)} · Checked out {fmtTime(todayRow?.check_out ?? null)}
              {todayRow?.status && (
                <>
                  {" · "}
                  <Badge tone={STATUS_TONE[todayRow.status as AttendanceStatus] ?? "neutral"}>
                    {todayRow.status}
                  </Badge>
                </>
              )}
            </p>
          </div>
          <SelfCheck
            checkedIn={!!todayRow?.check_in}
            checkedOut={!!todayRow?.check_out}
          />
        </div>
      </Card>

      {myRows.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No records yet"
          message="Check in today and your attendance history will build up here."
        />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <th className={thCls}>Date</th>
              <th className={thCls}>Check in</th>
              <th className={thCls}>Check out</th>
              <th className={thCls}>Status</th>
              <th className={thCls}>Note</th>
            </tr>
          </thead>
          <tbody>
            {myRows.map((r) => (
              <tr key={r.id}>
                <td className={`${tdCls} whitespace-nowrap font-semibold`}>{fmtDate(r.date)}</td>
                <td className={`${tdCls} whitespace-nowrap text-fg-muted`}>{fmtTime(r.check_in)}</td>
                <td className={`${tdCls} whitespace-nowrap text-fg-muted`}>{fmtTime(r.check_out)}</td>
                <td className={tdCls}>
                  <Badge tone={STATUS_TONE[(r.status as AttendanceStatus) ?? "neutral"] ?? "neutral"}>
                    {r.status}
                  </Badge>
                </td>
                <td className={`${tdCls} text-fg-muted`}>{r.note || "—"}</td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}
