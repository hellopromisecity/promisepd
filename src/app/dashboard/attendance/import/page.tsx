import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Fingerprint } from "lucide-react";
import { getCurrentUser, isManager } from "@/lib/auth";
import { PageHeader, Card } from "@/components/admin/ui";
import { STAFF_ROSTER } from "@/lib/staff-roster";
import ImportForm from "./ImportForm";

export const metadata: Metadata = {
  title: "Import attendance",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function ImportAttendancePage() {
  const me = await getCurrentUser();
  if (!me || !isManager(me.role)) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import attendance"
        subtitle="ZKTeco fingerprint device → daily hajira."
        action={
          <Link
            href="/dashboard/attendance"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg px-3 py-2 text-sm font-semibold text-fg hover:bg-bg-soft"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        }
      />

      <Card>
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-blue-tint text-brand-blue">
            <Fingerprint className="h-5 w-5" />
          </span>
          <div className="text-sm text-fg-muted">
            <p className="font-semibold text-fg">ZKTeco K40 / K50 / K60 / K90</p>
            <p className="mt-1">
              Export the attendance log from the device (USB stick or the ZKTime
              software) as <b>CSV</b> or <b>TXT</b>, then upload it here. Each
              punch needs an <b>employee code</b> and a <b>date</b> (a time is
              used for check-in / late). Attendance is matched to staff by their{" "}
              <b>employee code</b>, so set each person&apos;s code on the Staff
              page to match the code enrolled on the device.
            </p>
          </div>
        </div>
      </Card>

      <ImportForm />

      <Card>
        <h3 className="text-sm font-bold text-fg">Codes on the roster</h3>
        <p className="mt-1 text-xs text-fg-muted">
          The device&apos;s user IDs should match one of these (hyphens / case /
          spaces are ignored when matching).
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {STAFF_ROSTER.map((e) => (
            <span key={e.idNo} className="rounded-lg bg-bg-soft px-2.5 py-1 text-xs font-mono text-fg-muted">
              {e.idNo} · {e.name}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}
