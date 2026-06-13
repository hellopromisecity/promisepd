import { redirect } from "next/navigation";
import { CalendarCheck, Clock, UserX, CalendarDays } from "lucide-react";
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
import AttendanceRow from "./AttendanceRow";
import SelfCheck from "./SelfCheck";

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

export default async function AttendancePage() {
  const me = await getCurrentUser();
  if (!me || !isStaff(me.role)) redirect("/account");

  const today = todayStr();
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

  // ----- Manager / admin: whole-team view for today -----
  if (isManager(me.role)) {
    const { data: staff } = await admin
      .from("profiles")
      .select("id, name, mobile, role")
      .in("role", ["staff", "manager", "admin"])
      .order("name", { ascending: true });

    const team = staff ?? [];

    const { data: todayRows } = await admin
      .from("attendance")
      .select("member_id, status, check_in, check_out, note")
      .eq("date", today);

    const byMember = new Map(
      (todayRows ?? []).map((r) => [r.member_id, r]),
    );

    let present = 0;
    let late = 0;
    let absent = 0;
    for (const m of team) {
      const st = byMember.get(m.id)?.status;
      if (st === "present") present++;
      else if (st === "late") late++;
      else if (st === "absent") absent++;
    }

    return (
      <div className="space-y-6">
        <PageHeader title="Attendance" subtitle={`Team status · ${fmtDate(today)}`} />

        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Present today" value={present} icon={CalendarCheck} tone="success" />
          <StatCard label="Late" value={late} icon={Clock} tone="warning" />
          <StatCard label="Absent" value={absent} icon={UserX} tone="danger" />
        </div>

        {team.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="No staff yet"
            message="Staff, managers and admins will appear here."
          />
        ) : (
          <TableShell>
            <thead>
              <tr>
                <th className={thCls}>Member</th>
                <th className={thCls}>Check in</th>
                <th className={thCls}>Check out</th>
                <th className={thCls}>Status</th>
                <th className={thCls}>Set</th>
              </tr>
            </thead>
            <tbody>
              {team.map((m) => {
                const row = byMember.get(m.id);
                const status = (row?.status as AttendanceStatus | undefined) ?? null;
                return (
                  <tr key={m.id}>
                    <td className={tdCls}>
                      <div className="flex items-center gap-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-blue-tint text-xs font-bold text-brand-blue">
                          {(m.name?.[0] ?? "?").toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-fg">{m.name || "Unnamed"}</p>
                          <p className="truncate text-xs capitalize text-fg-muted">{m.role}</p>
                        </div>
                      </div>
                    </td>
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
                        memberId={m.id}
                        name={m.name || "this member"}
                        date={today}
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

  const { data: mine } = await admin
    .from("attendance")
    .select("id, date, check_in, check_out, status, note")
    .eq("member_id", me.id)
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
