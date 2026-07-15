"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Search, Download, X, Loader2, ArrowUpDown, Phone, MapPin, UserCheck, Receipt, Eye, Pencil, Trash2, CreditCard, Plus, UserPlus, Check } from "lucide-react";
import { Card, TableShell, thCls, tdCls } from "@/components/admin/ui";
import { confirmDialog } from "@/components/ui/Dialog";
import { toast } from "@/components/ui/Toast";
import {
  getHubCustomerDetail, listReferenceOfficers, listTxnTypes, createHubCustomer, updateHubCustomer,
  deleteHubCustomer, addHubPayment, updateHubPayment, deleteHubPayment, type RefOfficer, type CustomerInput, type TxnType,
} from "@/app/actions/hub";
import type { HubCustomer, HubPayment } from "@/lib/hub";

export type HubProject = { key: string; name: string; type: string; sort: number };

const fmt = (n: number) => "৳" + Math.round(Number(n) || 0).toLocaleString("en-IN");
const fmtDate = (iso: string | null) => { if (!iso) return "—"; try { return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); } catch { return iso; } };
const inputCls = "w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm text-fg outline-none focus:border-brand-blue/50";
const labelCls = "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-fg-muted";

type SortKey = "paid" | "name" | "remaining" | "joining" | "profit";

export default function HubCustomerList({ customers, project, projects, profits }: { customers: HubCustomer[]; project: HubProject; projects?: HubProject[]; profits?: Record<string, number> }) {
  const isAll = !!projects;
  const [q, setQ] = useState("");
  const [projFilter, setProjFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("paid");
  const [asc, setAsc] = useState(false);
  const [view, setView] = useState<HubCustomer | null>(null);
  const [edit, setEdit] = useState<HubCustomer | null>(null);
  const [txn, setTxn] = useState<HubCustomer | null>(null);
  const [adding, setAdding] = useState(false);
  const isDeposit = project.type === "deposit";
  const hasProfit = isDeposit && !!profits;
  const custProj = (c: HubCustomer): HubProject => ({ key: c.project_key, name: c.project_name, type: c.project_type, sort: 0 });

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    let r = customers.filter((c) => !term || `${c.name} ${c.file_no ?? ""} ${c.mobile ?? ""} ${c.district ?? ""} ${c.reference ?? ""} ${c.project_name}`.toLowerCase().includes(term));
    if (isAll && projFilter !== "all") r = r.filter((c) => c.project_key === projFilter);
    return [...r].sort((a, b) => {
      let d = 0;
      if (sortKey === "paid") d = a.total_paid - b.total_paid;
      else if (sortKey === "remaining") d = a.total_remaining - b.total_remaining;
      else if (sortKey === "name") d = a.name.localeCompare(b.name);
      else if (sortKey === "joining") d = (a.joining_date ?? "").localeCompare(b.joining_date ?? "");
      else if (sortKey === "profit") d = (profits?.[a.id] ?? 0) - (profits?.[b.id] ?? 0);
      return asc ? d : -d;
    });
  }, [customers, q, sortKey, asc, isAll, projFilter, profits]);

  const setSort = (k: SortKey) => { if (sortKey === k) setAsc((v) => !v); else { setSortKey(k); setAsc(false); } };
  const SortH = ({ k, label, right }: { k: SortKey; label: string; right?: boolean }) => (
    <button onClick={() => setSort(k)} className={`inline-flex items-center gap-1 ${right ? "flex-row-reverse" : ""} ${sortKey === k ? "text-brand-blue" : "hover:text-fg"}`}>{label}<ArrowUpDown className="h-3 w-3" /></button>
  );

  function exportCsv() {
    const mid = hasProfit ? ["Profit"] : [isDeposit ? "Dividend" : "Remaining"];
    const head = ["#", "Name", "File", "Mobile", "District", "Reference", "Paid", ...mid, "Joining"];
    const lines = [head.join(",")];
    rows.forEach((c, i) => {
      const midVals = hasProfit ? [Math.round(profits![c.id] || 0)] : [isDeposit ? c.dividend : c.total_remaining];
      lines.push([i + 1, c.name, c.file_no ?? "", c.mobile ?? "", c.district ?? "", c.reference ?? "", c.total_paid, ...midVals, c.joining_date ?? ""].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(","));
    });
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const u = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = u; a.download = `${project.key}-customers.csv`; a.click(); URL.revokeObjectURL(u);
  }

  const iconBtn = "grid h-8 w-8 place-items-center rounded-lg border border-border text-fg-faint transition-colors";

  return (
    <Card pad={false}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-xl border border-border bg-bg-soft px-3 py-2">
          <Search className="h-4 w-4 text-fg-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, file, mobile, district, officer…" className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-fg-faint" />
        </div>
        {isAll && projects && (
          <select value={projFilter} onChange={(e) => setProjFilter(e.target.value)} className="rounded-xl border border-border bg-bg px-3 py-2 text-sm font-medium text-fg">
            <option value="all">All projects</option>
            {projects.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
          </select>
        )}
        <div className="flex items-center gap-2 text-sm text-fg-muted">
          <span className="tabular-nums">{rows.length} of {customers.length}</span>
          <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg px-3 py-2 text-sm font-semibold text-fg hover:border-brand-blue/40"><Download className="h-4 w-4" /> Export</button>
          <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-3 py-2 text-sm font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark"><UserPlus className="h-4 w-4" /> Add customer</button>
        </div>
      </div>

      <TableShell>
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr>
              <th className={`${thCls} w-10`}>#</th>
              <th className={thCls}><SortH k="name" label="Customer" /></th>
              {isAll && <th className={thCls}>Project</th>}
              <th className={`${thCls} text-right`}><SortH k="paid" label="Paid" right /></th>
              <th className={`${thCls} text-right`}>{hasProfit ? <SortH k="profit" label="Profit" right /> : isDeposit ? "Dividend" : <SortH k="remaining" label="Remaining" right />}</th>
              <th className={`${thCls} text-right`}><SortH k="joining" label="Joined" right /></th>
              <th className={`${thCls} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={isAll ? 7 : 6} className="px-4 py-10 text-center text-fg-muted">No customers match.</td></tr>
            ) : rows.map((c, i) => (
              <tr key={c.id} className="align-top transition-colors hover:bg-bg-soft">
                <td className={`${tdCls} pt-4 text-fg-faint`}>{i + 1}</td>
                <td className={tdCls}>
                  <div className="font-semibold text-fg">{c.name || "—"} <span className="ml-1 text-[11px] font-normal text-fg-faint">File {c.file_no ?? "—"}</span></div>
                  <div className="mt-0.5 space-y-0.5 text-[11px] text-fg-muted">
                    <div className="flex items-center gap-1"><Phone className="h-3 w-3 text-fg-faint" /> {c.mobile ?? "—"}</div>
                    <div className="flex items-center gap-1"><MapPin className="h-3 w-3 text-fg-faint" /> {c.district ?? "—"}</div>
                    <div className="flex items-center gap-1"><UserCheck className="h-3 w-3 text-fg-faint" /> {c.reference ?? "—"}</div>
                  </div>
                </td>
                {isAll && <td className={`${tdCls} pt-4 text-fg-muted`}>{c.project_name}</td>}
                <td className={`${tdCls} pt-4 text-right font-bold tabular-nums text-brand-blue`}>{fmt(c.total_paid)}</td>
                <td className={`${tdCls} pt-4 text-right tabular-nums ${hasProfit ? "font-bold text-emerald-600" : isDeposit ? "text-emerald-600" : "text-fg-muted"}`}>
                  {hasProfit ? fmt(profits![c.id] || 0) : isDeposit ? fmt(c.dividend) : (c.total_remaining ? fmt(c.total_remaining) : "—")}
                </td>
                <td className={`${tdCls} pt-4 text-right text-fg-muted`}>{fmtDate(c.joining_date)}</td>
                <td className={`${tdCls} pt-3.5`}>
                  <div className="flex items-center justify-end gap-1.5">
                    <button onClick={() => setView(c)} title="View history" className={`${iconBtn} hover:border-brand-blue/40 hover:text-brand-blue`}><Eye className="h-4 w-4" /></button>
                    <button onClick={() => setEdit(c)} title="Edit" className={`${iconBtn} hover:border-brand-blue/40 hover:text-brand-blue`}><Pencil className="h-4 w-4" /></button>
                    <DeleteBtn customer={c} project={custProj(c)} className={iconBtn} />
                    <button onClick={() => setTxn(c)} title="Transactions" className={`${iconBtn} hover:border-emerald-300 hover:text-emerald-600`}><CreditCard className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>

      {view && <HistoryModal customer={view} isDeposit={view.project_type === "deposit"} onClose={() => setView(null)} />}
      {txn && <TransactionModal customer={txn} project={custProj(txn)} onClose={() => setTxn(null)} />}
      {(adding || edit) && <CustomerFormModal project={edit ? custProj(edit) : project} customer={edit} projects={isAll && !edit ? projects : undefined} onClose={() => { setAdding(false); setEdit(null); }} />}
    </Card>
  );
}

export function DeleteBtn({ customer, project, className }: { customer: HubCustomer; project: HubProject; className: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      title="Delete"
      className={`${className} hover:border-brand-red/40 hover:text-brand-red disabled:opacity-40`}
      onClick={async () => {
        const ok = await confirmDialog({ title: "Delete customer", message: `Remove “${customer.name}” from ${project.name}? Any referral commission credited to the marketing officer is reversed too.`, confirmText: "Delete", danger: true });
        if (!ok) return;
        start(async () => { const r = await deleteHubCustomer(customer.id, project.key); if (r.ok) toast(r.message || "Deleted.", "success"); else toast(r.error, "error"); });
      }}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </button>
  );
}

/** Modal shell. */
function Modal({ title, subtitle, onClose, children, wide }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-14" onClick={onClose}>
      <div className={`w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-2xl bg-bg shadow-2xl`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div><h3 className="text-lg font-bold text-fg">{title}</h3>{subtitle && <p className="text-xs text-fg-muted">{subtitle}</p>}</div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-fg-muted hover:bg-bg-soft"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

/** Marketing-officer autocomplete for the Reference field. */
function ReferencePicker({ value, valueName, onPick }: { value: string | null; valueName: string | null; onPick: (id: string | null, name: string) => void }) {
  const [officers, setOfficers] = useState<RefOfficer[] | null>(null);
  const [q, setQ] = useState(valueName ?? "");
  const [open, setOpen] = useState(false);
  useEffect(() => { let a = true; listReferenceOfficers().then((o) => { if (a) setOfficers(o); }); return () => { a = false; }; }, []);
  const matches = useMemo(() => {
    if (!officers) return [];
    const t = q.trim().toLowerCase();
    if (!t) return officers.slice(0, 30);
    return officers.filter((o) => `${o.name} ${o.code ?? ""} ${o.mobile ?? ""}`.toLowerCase().includes(t)).slice(0, 30);
  }, [officers, q]);
  return (
    <div className="relative">
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); if (e.target.value.trim() === "") onPick(null, ""); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={officers === null ? "Loading officers…" : "Type name / mobile / ID…"}
        className={inputCls}
      />
      {value && <span className="pointer-events-none absolute right-2 top-2.5 text-brand-blue"><Check className="h-4 w-4" /></span>}
      {open && matches.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-border bg-bg shadow-lg">
          {matches.map((o) => (
            <button key={o.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { onPick(o.id, o.name); setQ(o.name); setOpen(false); }}
              className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-bg-soft ${o.id === value ? "bg-brand-blue-tint" : ""}`}>
              <span className="truncate font-medium text-fg">{o.name}</span>
              <span className="shrink-0 text-[11px] text-fg-faint">{o.code ?? ""}{o.mobile ? ` · ${o.mobile}` : ""}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function CustomerFormModal({ project, customer, projects, onClose }: { project: HubProject; customer: HubCustomer | null; projects?: HubProject[]; onClose: () => void }) {
  const editing = !!customer;
  const [projKey, setProjKey] = useState(project.key);
  const activeProj = projects?.find((p) => p.key === projKey) ?? project;
  const [name, setName] = useState(customer?.name ?? "");
  const [file, setFile] = useState(customer?.file_no ?? "");
  const [mobile, setMobile] = useState(customer?.mobile ?? "");
  const [district, setDistrict] = useState(customer?.district ?? "");
  const [shares, setShares] = useState(String((customer?.bio?.shares as string) ?? ""));
  const [price, setPrice] = useState(customer ? String(customer.total_price || "") : "");
  const [joining, setJoining] = useState(customer?.joining_date ?? "");
  const [refId, setRefId] = useState<string | null>((customer as unknown as { reference_officer_id?: string })?.reference_officer_id ?? null);
  const [refName, setRefName] = useState(customer?.reference ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const earnsCommission = ["fuzala-tower", "fuzala-complex", "promise-city", "ahbab-palace-01", "ahbab-palace-02"].includes(activeProj.key);

  function submit() {
    setErr(null);
    if (!name.trim()) { setErr("Name is required."); return; }
    const input: CustomerInput = { name, file_no: file, mobile, district, shares, total_price: parseFloat(price) || 0, joining_date: joining, reference: refName, reference_officer_id: refId };
    start(async () => {
      const r = editing ? await updateHubCustomer(customer!.id, project.key, input) : await createHubCustomer(activeProj, input);
      if (r.ok) { toast(r.message || "Saved.", "success"); onClose(); } else setErr(r.error);
    });
  }

  return (
    <Modal title={editing ? "Edit customer" : "Add customer"} subtitle={activeProj.name} onClose={onClose}>
      {err && <div className="mb-3 rounded-xl border border-brand-red/30 bg-brand-red-tint px-3 py-2 text-sm text-brand-red-dark">{err}</div>}
      <div className="space-y-3">
        {projects && !editing && (
          <div><label className={labelCls}>Project *</label>
            <select className={inputCls} value={projKey} onChange={(e) => setProjKey(e.target.value)}>
              {projects.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
            </select>
          </div>
        )}
        <div><label className={labelCls}>Full name *</label><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>File no.</label><input className={inputCls} value={file} onChange={(e) => setFile(e.target.value)} /></div>
          <div><label className={labelCls}>Mobile</label><input className={inputCls} value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="01…" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>District</label><input className={inputCls} value={district} onChange={(e) => setDistrict(e.target.value)} /></div>
          <div><label className={labelCls}>Joining date</label><input type="date" className={inputCls} value={joining} onChange={(e) => setJoining(e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Shares / units <span className="font-normal normal-case text-fg-faint">(optional)</span></label><input type="number" min={0} className={inputCls} value={shares} onChange={(e) => setShares(e.target.value)} placeholder="Real estate only" /></div>
          <div><label className={labelCls}>Total price ৳</label><input type="number" className={inputCls} value={price} onChange={(e) => setPrice(e.target.value)} /></div>
        </div>
        <div>
          <label className={labelCls}>Reference (marketing officer)</label>
          <ReferencePicker value={refId} valueName={refName} onPick={(id, n) => { setRefId(id); setRefName(n); }} />
          {earnsCommission && refId && (
            <p className="mt-1 text-[11px] text-emerald-600">✓ This officer will be auto-credited points + commission for this {project.name} sale ({shares || 1} share{Number(shares) > 1 ? "s" : ""}).</p>
          )}
          {!earnsCommission && <p className="mt-1 text-[11px] text-fg-faint">Deposit schemes don’t earn marketing commission.</p>}
        </div>
        <button onClick={submit} disabled={pending} className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark disabled:opacity-60">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />} {editing ? "Save changes" : "Create customer"}
        </button>
      </div>
    </Modal>
  );
}

export function TransactionModal({ customer, project, onClose }: { customer: HubCustomer; project: HubProject; onClose: () => void }) {
  const [payments, setPayments] = useState<HubPayment[] | null>(null);
  const [types, setTypes] = useState<TxnType[]>([]);
  const [type, setType] = useState("deposit");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [receipt, setReceipt] = useState("");
  const [desc, setDesc] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // Transaction types from the catalogue, but always offer a Dividend (লভ্যাংশ)
  // option so admins can record a member's dividend even if the DB list lacks it.
  const txnOptions = useMemo(() => {
    const base = types.length ? types : [{ name: "deposit", operator: "+", classification: "" }];
    return base.some((t) => /^(dividend|লভ্যাংশ)$/i.test(t.name)) ? base : [...base, { name: "dividend", operator: "+", classification: "" }];
  }, [types]);

  const reload = () => getHubCustomerDetail(customer.id).then((d) => setPayments(d?.payments ?? []));
  useEffect(() => { let a = true; getHubCustomerDetail(customer.id).then((d) => { if (a) setPayments(d?.payments ?? []); }); listTxnTypes().then((t) => { if (a && t.length) setTypes(t); }); return () => { a = false; }; }, [customer.id]);

  function resetForm() { setAmount(""); setReceipt(""); setDesc(""); setEditingId(null); setErr(null); }

  function submit() {
    setErr(null);
    if (!(parseFloat(amount) > 0)) { setErr("Amount must be greater than 0."); return; }
    start(async () => {
      const payload = { date, amount: parseFloat(amount), type, description: desc, receipt_no: receipt };
      const r = editingId
        ? await updateHubPayment(editingId, project.key, payload)
        : await addHubPayment(customer.id, project.key, payload);
      if (r.ok) { toast(r.message || "Saved.", "success"); resetForm(); await reload(); } else setErr(r.error);
    });
  }

  // Load a transaction back into the form for editing. Recover the original
  // type + note from the stored "type — note" description; fall back to a
  // dropdown option that preserves the row's kind (deposit/withdrawal/dividend).
  function startEdit(p: HubPayment) {
    const d = p.description ?? "";
    const sep = d.indexOf(" — ");
    const rawType = (sep >= 0 ? d.slice(0, sep) : d).trim();
    const note = sep >= 0 ? d.slice(sep + 3) : "";
    const known = txnOptions.find((o) => o.name.toLowerCase() === rawType.toLowerCase());
    const pick = known ? known.name
      : p.kind === "withdrawal" ? (txnOptions.find((o) => o.operator === "-")?.name ?? (rawType || "withdrawal"))
      : p.kind === "dividend" ? (txnOptions.find((o) => /dividend|লভ্যাংশ|profit/i.test(o.name))?.name ?? "dividend")
      : (txnOptions.find((o) => o.operator === "+" && !/dividend|লভ্যাংশ|profit/i.test(o.name))?.name ?? txnOptions[0]?.name ?? "deposit");
    setType(pick);
    setAmount(String(p.amount));
    setDate(p.date ?? new Date().toISOString().slice(0, 10));
    setReceipt(p.receipt_no ?? "");
    setDesc(note);
    setEditingId(p.id);
    setErr(null);
  }

  async function del(p: HubPayment) {
    const ok = await confirmDialog({ title: "Remove transaction", message: `Delete ${fmt(p.amount)} on ${fmtDate(p.date)}?`, confirmText: "Delete", danger: true });
    if (!ok) return;
    const r = await deleteHubPayment(p.id, project.key);
    if (r.ok) { toast("Removed.", "success"); if (editingId === p.id) resetForm(); await reload(); } else toast(r.error, "error");
  }

  return (
    <Modal title={`Transactions — ${customer.name}`} subtitle={`${project.name} · paid ${fmt(customer.total_paid)}`} onClose={onClose} wide>
      <div className="grid gap-5 sm:grid-cols-[1fr_1.2fr]">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-bold text-fg">{editingId ? "Edit transaction" : "Add transaction"}</h4>
            {editingId && <button onClick={resetForm} className="text-[11px] font-semibold text-fg-muted hover:text-brand-blue">Cancel edit</button>}
          </div>
          {err && <div className="mb-2 rounded-lg border border-brand-red/30 bg-brand-red-tint px-3 py-2 text-xs text-brand-red-dark">{err}</div>}
          <div className="space-y-2.5">
            <div><label className={labelCls}>Type</label>
              <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
                {txnOptions.map((t) => <option key={t.name} value={t.name}>{t.name} ({t.operator})</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Amount ৳</label><input type="number" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelCls}>Date</label><input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div><label className={labelCls}>Receipt #</label><input className={inputCls} value={receipt} onChange={(e) => setReceipt(e.target.value)} /></div>
            </div>
            <div><label className={labelCls}>Note</label><input className={inputCls} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional" /></div>
            <button onClick={submit} disabled={pending} className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark disabled:opacity-60">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {editingId ? "Save changes" : "Add transaction"}
            </button>
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-sm font-bold text-fg"><Receipt className="h-4 w-4" /> History <span className="text-fg-faint">{payments ? `(${payments.length})` : ""}</span></div>
          {payments === null ? (
            <div className="py-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-brand-blue" /></div>
          ) : payments.length === 0 ? (
            <p className="py-6 text-center text-sm text-fg-muted">No transactions yet.</p>
          ) : (
            <div className="max-h-[46vh] space-y-1.5 overflow-y-auto pr-1">
              {payments.map((p) => (
                <div key={p.id} className={`group flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${editingId === p.id ? "border-brand-blue/50 bg-brand-blue-tint" : "border-border bg-bg-soft"}`}>
                  <div className="min-w-0">
                    <span className="font-medium text-fg">{fmtDate(p.date)}</span>
                    {p.description && <span className="ml-2 text-xs text-fg-muted">{p.description}</span>}
                    {p.receipt_no && <span className="ml-2 text-[11px] text-fg-faint">#{p.receipt_no}</span>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className={`font-bold tabular-nums ${p.kind === "withdrawal" ? "text-brand-red" : p.kind === "dividend" ? "text-emerald-600" : "text-brand-blue"}`}>{p.kind === "withdrawal" ? "−" : "+"}{fmt(p.amount)}</span>
                    <button onClick={() => startEdit(p)} title="Edit" className="rounded p-1 text-fg-faint opacity-0 transition-opacity hover:text-brand-blue group-hover:opacity-100"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => del(p)} title="Delete" className="rounded p-1 text-fg-faint opacity-0 transition-opacity hover:text-brand-red group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

export function HistoryModal({ customer, isDeposit, onClose }: { customer: HubCustomer; isDeposit: boolean; onClose: () => void }) {
  const [payments, setPayments] = useState<HubPayment[] | null>(null);
  useEffect(() => { let a = true; getHubCustomerDetail(customer.id).then((d) => { if (a) setPayments(d?.payments ?? []); }); return () => { a = false; }; }, [customer.id]);
  const bio = customer.bio || {};
  const b = (k: string) => (bio[k] as string) || null;
  const bioRows: [string, string | null][] = [
    ["Father / Husband", b("father_husband")], ["Mother", b("mother")],
    ["Address", [b("village"), b("post_office"), b("police_station"), customer.district].filter(Boolean).join(", ") || null],
    ["NID", customer.nid], ["Nominee", b("nominee_name") ? `${b("nominee_name")}${b("nominee_relationship") ? ` (${b("nominee_relationship")})` : ""}` : null],
    ["Nominee mobile", b("nominee_mobile")], ["Unit", [b("block") && `Block ${b("block")}`, b("plot") && `Plot ${b("plot")}`, b("flat") && `Flat ${b("flat")}`, b("flat_size")].filter(Boolean).join(" · ") || null], ["Shares", b("shares")],
  ];
  return (
    <Modal title={customer.name || "—"} subtitle={`${customer.project_name} · File ${customer.file_no ?? "—"}${customer.mobile ? ` · ${customer.mobile}` : ""}${customer.reference ? ` · ref ${customer.reference}` : ""}`} onClose={onClose} wide>
      <div className={`grid grid-cols-2 gap-2 ${isDeposit ? "sm:grid-cols-5" : "sm:grid-cols-4"}`}>
        <Stat label="Total paid" value={fmt(customer.total_paid)} tone="blue" />
        {isDeposit ? (
          <>
            <Stat label="Total withdrawn" value={fmt(customer.withdrawn)} />
            <Stat label="Total dividend" value={fmt(customer.dividend)} />
            {/* Remaining balance = everything still held for the customer:
                deposits + dividends − withdrawals (what's actually left in the
                company after every withdrawal). */}
            <Stat label="Remaining balance" value={fmt(customer.total_paid + customer.dividend - customer.withdrawn)} tone="green" />
            <Stat label="Transactions" value={String(customer.payments_count)} />
          </>
        ) : (
          <>
            <Stat label="Price" value={fmt(customer.total_price)} />
            <Stat label="Remaining" value={fmt(customer.total_remaining)} />
            <Stat label="Payments" value={String(customer.payments_count)} />
          </>
        )}
      </div>
      <div className="mt-4 grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
        {bioRows.filter(([, v]) => v).map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2 border-b border-border/50 py-1 text-[13px]"><span className="shrink-0 text-fg-faint">{k}</span><span className="text-right font-medium text-fg">{v}</span></div>
        ))}
      </div>
      <div className="mt-4">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-fg-muted"><Receipt className="h-3.5 w-3.5" /> Payment ledger</div>
        {payments === null ? <div className="py-6 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-brand-blue" /></div> : payments.length === 0 ? <p className="py-4 text-center text-sm text-fg-muted">No payments recorded.</p> : (
          <div className="max-h-[38vh] space-y-1.5 overflow-y-auto pr-1">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-bg-soft px-3 py-2 text-sm">
                <div className="min-w-0"><span className="font-medium text-fg">{fmtDate(p.date)}</span>{p.description && <span className="ml-2 text-xs text-fg-muted">{p.description}</span>}{p.receipt_no && <span className="ml-2 text-[11px] text-fg-faint">#{p.receipt_no}</span>}</div>
                <span className={`shrink-0 font-bold tabular-nums ${p.kind === "withdrawal" ? "text-brand-red" : p.kind === "dividend" ? "text-emerald-600" : "text-brand-blue"}`}>{p.kind === "withdrawal" ? "−" : "+"}{fmt(p.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "blue" | "green" }) {
  const box = tone === "blue" ? "bg-brand-blue-tint" : tone === "green" ? "bg-emerald-50" : "bg-bg-soft";
  const txt = tone === "blue" ? "text-brand-blue-dark" : tone === "green" ? "text-emerald-700" : "text-fg";
  return <div className={`rounded-xl px-3 py-2 ${box}`}><div className="text-[10px] font-semibold uppercase tracking-wide text-fg-faint">{label}</div><div className={`text-sm font-extrabold tabular-nums ${txt}`}>{value}</div></div>;
}
