"use client";

/** Blog article list — status tabs (All / Published / Draft / Scheduled)
 *  with counts, search, and a table mirroring the reference CMS: title +
 *  permalink, category, type, status, date, views, internal-link count,
 *  and row actions (view / edit / delete). */

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, SquarePen, Trash2, ExternalLink, Link2, Loader2 } from "lucide-react";
import { deletePost } from "@/app/actions/admin-blog";
import { confirmDialog } from "@/components/ui/Dialog";
import { toast } from "@/components/ui/Toast";

export type BlogRow = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  accessType: string;
  status: string;
  date: string;
  views: number;
  links: number;
};

type Tab = "all" | "published" | "draft" | "scheduled";

const STATUS_STYLE: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-700",
  draft: "bg-amber-50 text-amber-700",
  scheduled: "bg-brand-blue-tint text-brand-blue-dark",
};

export default function BlogList({ rows, newButton }: { rows: BlogRow[]; newButton: React.ReactNode }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const counts = useMemo(
    () => ({
      all: rows.length,
      published: rows.filter((r) => r.status === "published").length,
      draft: rows.filter((r) => r.status === "draft").length,
      scheduled: rows.filter((r) => r.status === "scheduled").length,
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (tab !== "all" && r.status !== tab) return false;
      if (term && !`${r.title} ${r.slug} ${r.category ?? ""}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [rows, tab, q]);

  async function onDelete(row: BlogRow) {
    const ok = await confirmDialog({ title: "Delete article", message: `Delete “${row.title}”? This can’t be undone.`, confirmText: "Delete", danger: true });
    if (!ok) return;
    setBusyId(row.id);
    startTransition(async () => {
      const res = await deletePost(row.id);
      setBusyId(null);
      if (res.ok) router.refresh();
      else toast(res.error, "error");
    });
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "published", label: "Published" },
    { key: "draft", label: "Draft" },
    { key: "scheduled", label: "Scheduled" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-fg sm:text-2xl">Blog</h1>
          <p className="mt-0.5 text-sm text-fg-muted">Write, publish and manage your articles.</p>
        </div>
        {newButton}
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              tab === t.key ? "bg-fg text-bg" : "bg-bg text-fg-muted border border-border hover:text-fg"
            }`}
          >
            {t.label}
            <span className={`rounded-full px-1.5 text-xs ${tab === t.key ? "bg-bg/20" : "text-fg-faint"}`}>
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-xl border border-border bg-bg px-3 py-2.5">
        <Search className="h-4 w-4 text-fg-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search articles…"
          className="w-full bg-transparent text-sm text-fg placeholder:text-fg-faint outline-none"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-bg">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wide text-fg-faint">
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Views</th>
              <th className="px-4 py-3 font-semibold">Links</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-fg-muted">
                  No articles {q || tab !== "all" ? "match your filter" : "yet"}.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-bg-soft/50">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/blog/${r.id}`} className="font-semibold text-fg hover:text-brand-blue">
                      {r.title}
                    </Link>
                    <div className="text-xs text-fg-faint">/{r.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-fg-muted">{r.category || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-md bg-bg-soft px-2 py-0.5 text-xs font-medium capitalize text-fg-muted">
                      {r.accessType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLE[r.status] ?? "bg-bg-soft text-fg-muted"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-fg-muted">
                    {new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-fg-muted">{r.views}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${r.links === 0 ? "bg-brand-red-tint text-brand-red-dark" : "bg-emerald-50 text-emerald-700"}`}>
                      <Link2 className="h-3 w-3" /> {r.links}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5 text-fg-faint">
                      <a href={`/blog/${r.slug}`} target="_blank" rel="noopener noreferrer" title="View on site" className="rounded-md p-1.5 hover:bg-bg-soft hover:text-brand-blue">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <Link href={`/dashboard/blog/${r.id}`} title="Edit" className="rounded-md p-1.5 hover:bg-bg-soft hover:text-brand-blue">
                        <SquarePen className="h-4 w-4" />
                      </Link>
                      <button onClick={() => onDelete(r)} disabled={busyId === r.id} title="Delete" className="rounded-md p-1.5 hover:bg-brand-red-tint hover:text-brand-red disabled:opacity-50">
                        {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
