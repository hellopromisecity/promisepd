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
import AttendanceRow from "./AttendanceRow";
import SelfCheck from "./SelfCheck";
import AttendanceDate from "./AttendanceDate";

export const dynamic = "force-dynamic";

type AttendanceStatus = "present" | "late" | "absent" | "leave" | "holiday";

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

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
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
  searchParams: Promise<{ date?: string }>;
}) {
  const me = await getCurrentUser();
  if (!me || !isStaff(me.role)) redirect("/account");

  const today = todayStr();
  const sp = await searchParams;
  // Managers can review/mark any past date via ?date=; default today.
  const selDate =
    sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) && sp.date <= today ? sp.date : today;
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

  // ----- Manager / admin: whole-team view for the selected date -----
  if (isManager(me.role)) {
    // Every employee on the roster (login or not) + any extra accounts.
    // `employee_code` only exists once migration 0016 is applied — fall
    // back to the base columns so this never errors out.
    const selProfiles = (cols: string) =>
      admin.from("profiles").select(cols).order("name", { ascending: true });
    let pres = await selProfiles("id, name, mobile, role, employee_code");
    if (pres.error?.code === "42703") pres = await selProfiles("id, name, mobile, role");
    const accounts = (pres.error ? [] : pres.data ?? []) as unknown as StaffAccount[];
    const directory = buildStaffDirectory(accounts);

    // Attendance for the day, keyed by staff_ref.
    const { data: dayRows } = await admin
      .from("attendance")
      .select("staff_ref, status, check_in, check_out, note")
      .eq("date", selDate);
    const byRef = new Map(
      (dayRows ?? []).map((r) => [(r as { staff_ref: string | null }).staff_ref ?? "", r]),
    );

    let present = 0;
    let late = 0;
    let absent = 0;
    for (const d of directory) {
      const st = byRef.get(d.ref)?.status;
      if (st === "present") present++;
      else if (st === "late") late++;
      else if (st === "absent") absent++;
    }

    return (
      <div className="space-y-6">
        <PageHeader
          title="Attendance"
          subtitle={`Team status · ${fmtDate(selDate)}${selDate !== today ? "" : " (today)"}`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <AttendanceDate value={selDate} today={today} />
              <Link
                href="/dashboard/attendance/import"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg px-3 py-1.5 text-sm font-semibold text-brand-blue hover:bg-brand-blue-tint"
              >
                <Upload className="h-4 w-4" /> Import (ZKTeco)
              </Link>
            </div>
          }
        />

        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Present" value={present} icon={CalendarCheck} tone="success" />
          <StatCard label="Late" value={late} icon={Clock} tone="warning" />
          <StatCard label="Absent" value={absent} icon={UserX} tone="danger" />
        </div>

        {directory.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="No staff yet"
            message="Employees from the roster and registered accounts will appear here."
          />
        ) : (
          <TableShell>
            <thead>
              <tr>
                <th className={thCls}>Employee</th>
                <th className={thCls}>Code</th>
                <th className={thCls}>Check in</th>
                <th className={thCls}>Check out</th>
                <th className={thCls}>Status</th>
                <th className={thCls}>Set</th>
              </tr>
            </thead>
            <tbody>
              {directory.map((d) => {
                const row = byRef.get(d.ref);
                const status = (row?.status as AttendanceStatus | undefined) ?? null;
                const meta = [d.designation, d.district].filter(Boolean).join(" · ");
                return (
                  <tr key={d.ref}>
                    <td className={tdCls}>
                      <div className="flex items-center gap-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-blue-tint text-xs font-bold text-brand-blue">
                          {(d.name?.[0] ?? "?").toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-fg">{d.name || "Unnamed"}</p>
                          <p className="truncate text-xs text-fg-muted">{meta || d.mobile}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`${tdCls} whitespace-nowrap font-mono text-xs text-fg-muted`}>{d.code || "—"}</td>
                    <td className={`${tdCls} whitespace-nowrap text-fg-muted`}>{fmtTime(row?.check_in ?? null)}</td>
                    <td className={`${tdCls} whitespace-nowrap text-fg-muted`}>{fmtTime(row?.check_out ?? null)}</td>
                    <td className={tdCls}>
                      {status ? (
                        <Badge tone={STATUS_TONE[status]}>{status}</Badge>
                      ) : (
                        <span className="text-xs text-fg-faint">not marked</span>
                      )}
                    </td>
                    <td className={tdCls}>
                      <AttendanceRow
                        staffRef={d.ref}
                        memberId={d.account?.id ?? null}
                        name={d.name || "this member"}
                        date={selDate}
                        current={status}
                        note={row?.note ?? null}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableShell>
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
