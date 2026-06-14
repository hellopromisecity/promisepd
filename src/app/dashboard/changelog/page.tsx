import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Rocket } from "lucide-react";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import {
  CHANGELOG,
  CHANGELOG_FOOTER,
  CURRENT_VERSION,
  type ChangeKind,
} from "@/lib/changelog";

export const metadata: Metadata = {
  title: "Changelog",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const KIND_META: Record<ChangeKind, { label: string; cls: string }> = {
  new: { label: "New", cls: "bg-emerald-50 text-emerald-700" },
  improved: { label: "Improved", cls: "bg-brand-blue-tint text-brand-blue-dark" },
  fixed: { label: "Fixed", cls: "bg-amber-50 text-amber-700" },
  changed: { label: "Changed", cls: "bg-bg-soft text-fg-muted" },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ChangelogPage() {
  const me = await getCurrentUser();
  if (!me || !isStaff(me.role)) redirect("/account");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Changelog"
        subtitle={`What's new across Promise City — currently v${CURRENT_VERSION}.`}
      />

      <div className="overflow-hidden rounded-2xl border border-border bg-bg">
        {/* Scrollable box so the release history never stretches the page. */}
        <div className="max-h-[62vh] overflow-y-auto p-5 sm:p-6 [scrollbar-gutter:stable]">
          <ol className="relative space-y-8 border-l border-border pl-6">
            {CHANGELOG.map((entry, i) => (
              <li key={entry.version} className="relative">
                <span
                  className={`absolute -left-[1.7rem] top-0.5 grid h-5 w-5 place-items-center rounded-full ring-4 ring-bg ${
                    i === 0 ? "bg-brand-blue text-white" : "bg-bg-soft text-fg-faint"
                  }`}
                >
                  <Rocket className="h-2.5 w-2.5" />
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-lg px-2.5 py-0.5 text-sm font-extrabold ${
                      i === 0 ? "bg-brand-blue text-white" : "bg-bg-soft text-fg"
                    }`}
                  >
                    v{entry.version}
                  </span>
                  {i === 0 && (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                      Latest
                    </span>
                  )}
                  <span className="text-xs text-fg-faint">{fmtDate(entry.date)}</span>
                </div>

                <h3 className="mt-1.5 text-base font-bold text-fg">{entry.title}</h3>

                <ul className="mt-2 space-y-1.5">
                  {entry.changes.map((c, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-fg-muted">
                      <span
                        className={`mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${KIND_META[c.kind].cls}`}
                      >
                        {KIND_META[c.kind].label}
                      </span>
                      <span className="leading-relaxed">{c.text}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>

        {/* Universal footer */}
        <div className="border-t border-border px-5 py-4 text-center text-xs text-fg-muted sm:px-6">
          {CHANGELOG_FOOTER.company} · v{CURRENT_VERSION} · Powered by{" "}
          <a
            href={CHANGELOG_FOOTER.poweredByUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-blue hover:underline"
          >
            {CHANGELOG_FOOTER.poweredByLabel}
          </a>
        </div>
      </div>
    </div>
  );
}
