import { Hammer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ADMIN_NAV, isGroup } from "@/lib/admin-nav";

export const dynamic = "force-dynamic";

/** Friendly placeholder for admin sections not built yet.  Any real
 *  page (e.g. /admin/projects/page.tsx) takes precedence over this
 *  catch-all, so sections light up one by one as they ship. */

function labelFor(path: string): string {
  for (const e of ADMIN_NAV) {
    if (isGroup(e)) {
      const hit = e.children.find((c) => c.href === path);
      if (hit) return `${e.label} · ${hit.label}`;
    } else if (e.href === path) {
      return e.label;
    }
  }
  const last = path.split("/").filter(Boolean).pop() ?? "Section";
  return last.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export default async function AdminPlaceholder({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const title = labelFor(`/admin/${slug.join("/")}`);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-fg sm:text-2xl">{title}</h1>
        <p className="mt-0.5 text-sm text-fg-muted">This section is part of the dashboard build.</p>
      </div>

      <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-bg px-6 py-16 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-blue-tint text-brand-blue">
          <Hammer className="h-7 w-7" />
        </span>
        <h2 className="mt-4 text-lg font-bold text-fg">Coming soon</h2>
        <p className="mt-1 max-w-sm text-sm text-fg-muted">
          “{title}” is being built. We’re shipping the dashboard section by section — this one is on the way.
        </p>
        <Link
          href="/admin"
          className="mt-5 inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-fg hover:border-brand-blue/40 hover:text-brand-blue"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </div>
    </div>
  );
}
