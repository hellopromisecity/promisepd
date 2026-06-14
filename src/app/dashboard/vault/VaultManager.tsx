"use client";

/** Secure Vault UI — a searchable grid of credential cards with copy +
 *  reveal controls, and an add / edit modal.  All writes go through the
 *  admin-vault server actions (service-role, manager-gated). */

import { useMemo, useState, useTransition } from "react";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Copy, Check, ExternalLink,
  KeyRound, Globe, Search, Loader2, X, Lock,
} from "lucide-react";
import {
  createCredential, updateCredential, deleteCredential,
  type VaultCredential, type VaultInput,
} from "@/app/actions/admin-vault";
import { confirmDialog } from "@/components/ui/Dialog";
import { toast } from "@/components/ui/Toast";

const EMPTY: VaultInput = { site_name: "", site_url: "", login_url: "", username: "", password: "", notes: "" };

export default function VaultManager({ initial }: { initial: VaultCredential[] }) {
  const [items, setItems] = useState<VaultCredential[]>(initial);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<VaultCredential | null>(null);
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (c) =>
        c.site_name.toLowerCase().includes(q) ||
        (c.username ?? "").toLowerCase().includes(q) ||
        (c.site_url ?? "").toLowerCase().includes(q),
    );
  }, [items, query]);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-bg px-3.5 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-fg-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search credentials…"
            className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-fg-faint"
          />
        </div>
        <button
          onClick={() => { setAdding(true); setEditing(null); }}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark"
        >
          <Plus className="h-4 w-4" /> Add New
        </button>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-bg p-12 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-bg-soft text-fg-muted">
            <Lock className="h-6 w-6" />
          </span>
          <p className="mt-4 text-sm font-semibold text-fg">
            {items.length === 0 ? "No credentials yet" : "No matches"}
          </p>
          <p className="mt-1 text-xs text-fg-muted">
            {items.length === 0 ? "Click “Add New” to store your first login." : "Try a different search."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <CredentialCard
              key={c.id}
              cred={c}
              onEdit={() => { setEditing(c); setAdding(false); }}
              onDeleted={(id) => setItems((xs) => xs.filter((x) => x.id !== id))}
            />
          ))}
        </div>
      )}

      {(adding || editing) && (
        <CredentialModal
          cred={editing}
          onClose={() => { setAdding(false); setEditing(null); }}
          onSaved={(saved) =>
            setItems((xs) => {
              const i = xs.findIndex((x) => x.id === saved.id);
              if (i === -1) return [...xs, saved].sort((a, b) => a.site_name.localeCompare(b.site_name));
              const copy = [...xs];
              copy[i] = saved;
              return copy;
            })
          }
        />
      )}
    </div>
  );
}

function CredentialCard({
  cred,
  onEdit,
  onDeleted,
}: {
  cred: VaultCredential;
  onEdit: () => void;
  onDeleted: (id: string) => void;
}) {
  const [show, setShow] = useState(false);
  const [pending, startTransition] = useTransition();

  async function copy(text: string | null, what: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast(`${what} copied`, "success");
    } catch {
      toast("Couldn’t copy — copy manually.", "error");
    }
  }

  function onDelete() {
    confirmDialog({
      title: "Delete credential?",
      message: `Remove the saved login for “${cred.site_name}”? This can’t be undone.`,
      confirmText: "Delete",
      danger: true,
    }).then((ok) => {
      if (!ok) return;
      startTransition(async () => {
        const res = await deleteCredential(cred.id);
        if (res.ok) { toast("Credential deleted.", "success"); onDeleted(cred.id); }
        else toast(res.error, "error");
      });
    });
  }

  const visitHref = cred.login_url || cred.site_url || null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-bg">
      <div className="h-1 w-full bg-gradient-to-r from-brand-blue to-brand-red" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-blue-tint text-brand-blue">
              <Globe className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-fg">{cred.site_name}</p>
              {visitHref && (
                <a href={visitHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline">
                  Visit site <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <button onClick={onEdit} className="grid h-7 w-7 place-items-center rounded-lg text-fg-muted hover:bg-bg-soft hover:text-fg" aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></button>
            <button onClick={onDelete} disabled={pending} className="grid h-7 w-7 place-items-center rounded-lg text-fg-muted hover:bg-brand-red-tint hover:text-brand-red disabled:opacity-50" aria-label="Delete">
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {cred.username && (
            <Field icon={<span className="text-[11px] font-bold text-fg-faint">@</span>} value={cred.username} onCopy={() => copy(cred.username, "Username")} />
          )}
          {cred.password && (
            <Field
              icon={<KeyRound className="h-3.5 w-3.5 text-fg-faint" />}
              value={show ? cred.password : "•".repeat(Math.min(14, cred.password.length || 10))}
              mono={show}
              onCopy={() => copy(cred.password, "Password")}
              trailing={
                <button onClick={() => setShow((v) => !v)} className="text-fg-muted hover:text-fg" aria-label={show ? "Hide" : "Show"}>
                  {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              }
            />
          )}
        </div>

        {cred.notes && <p className="mt-2 line-clamp-2 text-xs text-fg-muted">{cred.notes}</p>}
      </div>
    </div>
  );
}

function Field({
  icon, value, onCopy, trailing, mono,
}: {
  icon: React.ReactNode;
  value: string;
  onCopy: () => void;
  trailing?: React.ReactNode;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-lg bg-bg-soft px-2.5 py-2">
      <span className="grid h-4 w-4 shrink-0 place-items-center">{icon}</span>
      <span className={`min-w-0 flex-1 truncate text-sm text-fg ${mono ? "font-mono" : ""}`}>{value}</span>
      {trailing}
      <button
        onClick={() => { onCopy(); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
        className="text-fg-muted hover:text-brand-blue"
        aria-label="Copy"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

function CredentialModal({
  cred,
  onClose,
  onSaved,
}: {
  cred: VaultCredential | null;
  onClose: () => void;
  onSaved: (c: VaultCredential) => void;
}) {
  const editing = !!cred;
  const [form, setForm] = useState<VaultInput>(
    cred
      ? {
          site_name: cred.site_name,
          site_url: cred.site_url ?? "",
          login_url: cred.login_url ?? "",
          username: cred.username ?? "",
          password: cred.password ?? "",
          notes: cred.notes ?? "",
        }
      : { ...EMPTY },
  );
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = (k: keyof VaultInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function save() {
    setError(null);
    if (!(form.site_name ?? "").trim()) { setError("Site name is required."); return; }
    startTransition(async () => {
      const res = editing ? await updateCredential(cred!.id, form) : await createCredential(form);
      if (res.ok) {
        const id = editing ? cred!.id : (res as { data?: { id: string } }).data?.id ?? crypto.randomUUID();
        onSaved({
          id,
          site_name: form.site_name.trim(),
          site_url: form.site_url?.trim() || null,
          login_url: form.login_url?.trim() || null,
          username: form.username?.trim() || null,
          password: form.password?.trim() || null,
          notes: form.notes?.trim() || null,
        });
        toast(editing ? "Credential updated." : "Credential saved.", "success");
        onClose();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-bg shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-fg">
            <Lock className="h-4 w-4 text-brand-blue" /> {editing ? "Edit credential" : "Add credential"}
          </h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted hover:bg-bg-soft"><X className="h-4 w-4" /></button>
        </div>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-5">
          {error && <p className="rounded-lg bg-brand-red-tint px-3 py-2 text-sm text-brand-red-dark">{error}</p>}
          <FieldInput label="Site name *" value={form.site_name} onChange={set("site_name")} placeholder="e.g. Supabase" />
          <FieldInput label="Site URL" value={form.site_url ?? ""} onChange={set("site_url")} placeholder="https://supabase.com" />
          <FieldInput label="Login URL" value={form.login_url ?? ""} onChange={set("login_url")} placeholder="https://app.supabase.com/sign-in" />
          <FieldInput label="Email / username" value={form.username ?? ""} onChange={set("username")} placeholder="you@example.com" />
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-fg-muted">Password</label>
            <div className="flex items-center rounded-xl border border-border bg-bg-soft pr-2 focus-within:border-brand-blue/50">
              <input
                type={showPw ? "text" : "password"}
                value={form.password ?? ""}
                onChange={set("password")}
                placeholder="••••••••"
                className="w-full bg-transparent px-3 py-2.5 text-sm text-fg outline-none"
              />
              <button onClick={() => setShowPw((v) => !v)} className="text-fg-muted hover:text-fg" aria-label={showPw ? "Hide" : "Show"}>
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-fg-muted">Notes</label>
            <textarea value={form.notes ?? ""} onChange={set("notes")} rows={2} placeholder="Optional notes…" className="w-full resize-y rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm text-fg outline-none focus:border-brand-blue/50" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3.5">
          <button onClick={onClose} className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-fg hover:bg-bg-soft">Cancel</button>
          <button onClick={save} disabled={pending} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark disabled:opacity-60">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldInput({
  label, value, onChange, placeholder,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-fg-muted">{label}</label>
      <input value={value} onChange={onChange} placeholder={placeholder} className="w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm text-fg outline-none focus:border-brand-blue/50" />
    </div>
  );
}
