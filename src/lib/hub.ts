import "server-only";
import { getAdmin } from "@/lib/admin-guard";

/** Project Hub — the imported per-project customer ledger (hub_customers +
 *  hub_customer_payments). Read via the service role, server-side only, like
 *  the rest of the dashboard. Separate from the ported investor platform. */

export type HubCustomer = {
  id: string;
  project_key: string;
  project_name: string;
  project_type: string;
  file_no: string | null;
  name: string;
  mobile: string | null;
  district: string | null;
  nid: string | null;
  reference: string | null;
  joining_date: string | null;
  total_price: number;
  total_paid: number;
  total_remaining: number;
  dividend: number;
  withdrawn: number;
  balance: number;
  payments_count: number;
  reference_officer_id: string | null;
  investor_uid: string | null;
  bio: Record<string, unknown>;
};

export type HubProjectSummary = {
  key: string;
  name: string;
  type: string;
  sort: number;
  customers: number;
  payers: number;
  raised: number;
  payments: number;
  avg: number;
};

export type HubPayment = {
  id: string;
  seq: number;
  date: string | null;
  description: string | null;
  amount: number;
  receipt_no: string | null;
  kind: string;
};

const n = (v: unknown) => Number(v) || 0;

/** Per-project rollup for the hub grid + top KPIs. */
export async function hubProjectSummaries(): Promise<HubProjectSummary[]> {
  const admin = getAdmin();
  if (!admin) return [];
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await admin
      .from("hub_customers")
      .select("project_key, project_name, project_type, sort_order, total_paid, payments_count")
      .range(from, from + 999);
    const r = data ?? [];
    rows.push(...r);
    if (r.length < 1000) break;
  }
  const m = new Map<string, HubProjectSummary>();
  for (const c of rows) {
    const k = c.project_key as string;
    if (!m.has(k)) m.set(k, { key: k, name: c.project_name as string, type: c.project_type as string, sort: n(c.sort_order), customers: 0, payers: 0, raised: 0, payments: 0, avg: 0 });
    const s = m.get(k)!;
    s.customers++;
    s.payments += n(c.payments_count);
    const paid = n(c.total_paid);
    s.raised += paid;
    if (paid > 0) s.payers++;
  }
  return [...m.values()].map((s) => ({ ...s, avg: s.payers ? s.raised / s.payers : 0 })).sort((a, b) => a.sort - b.sort);
}

/** Every customer across all projects (the All-Customer view). */
export async function hubAllCustomers(): Promise<HubCustomer[]> {
  const admin = getAdmin();
  if (!admin) return [];
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await admin.from("hub_customers").select("*").order("total_paid", { ascending: false }).range(from, from + 999);
    const r = (data ?? []) as Record<string, unknown>[];
    rows.push(...r);
    if (r.length < 1000) break;
  }
  return rows.map(mapCustomer);
}

/** All customers of one project, richest payers first. */
export async function hubProjectCustomers(key: string): Promise<HubCustomer[]> {
  const admin = getAdmin();
  if (!admin || !key) return [];
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await admin
      .from("hub_customers")
      .select("*")
      .eq("project_key", key)
      .order("total_paid", { ascending: false })
      .range(from, from + 999);
    const r = data ?? [];
    rows.push(...r);
    if (r.length < 1000) break;
  }
  return rows.map(mapCustomer);
}

/** One customer + their full payment ledger. */
export async function hubCustomer(id: string): Promise<{ customer: HubCustomer; payments: HubPayment[] } | null> {
  const admin = getAdmin();
  if (!admin || !id) return null;
  const { data: c } = await admin.from("hub_customers").select("*").eq("id", id).maybeSingle();
  if (!c) return null;
  const { data: p } = await admin.from("hub_customer_payments").select("*").eq("customer_id", id).order("seq", { ascending: true });
  return {
    customer: mapCustomer(c as Record<string, unknown>),
    payments: ((p ?? []) as Record<string, unknown>[]).map((x) => ({ id: x.id as string, seq: n(x.seq), date: (x.date as string) ?? null, description: (x.description as string) ?? null, amount: n(x.amount), receipt_no: (x.receipt_no as string) ?? null, kind: (x.kind as string) ?? "deposit" })),
  };
}

/** One project's meta (name/type/sort) — used by the detail header + add-form. */
export async function hubProjectMeta(key: string): Promise<{ name: string; type: string; sort: number } | null> {
  const admin = getAdmin();
  if (!admin || !key) return null;
  const { data } = await admin.from("hub_customers").select("project_name, project_type, sort_order").eq("project_key", key).limit(1).maybeSingle();
  const d = data as Record<string, unknown> | null;
  return d ? { name: d.project_name as string, type: d.project_type as string, sort: n(d.sort_order) } : null;
}

function mapCustomer(c: Record<string, unknown>): HubCustomer {
  return {
    id: c.id as string,
    project_key: c.project_key as string,
    project_name: c.project_name as string,
    project_type: c.project_type as string,
    file_no: (c.file_no as string) ?? null,
    name: (c.name as string) ?? "",
    mobile: (c.mobile as string) ?? null,
    district: (c.district as string) ?? null,
    nid: (c.nid as string) ?? null,
    reference: (c.reference as string) ?? null,
    joining_date: (c.joining_date as string) ?? null,
    total_price: n(c.total_price),
    total_paid: n(c.total_paid),
    total_remaining: n(c.total_remaining),
    dividend: n(c.dividend),
    withdrawn: n(c.withdrawn),
    balance: n(c.balance),
    payments_count: n(c.payments_count),
    reference_officer_id: (c.reference_officer_id as string) ?? null,
    investor_uid: (c.investor_uid as string) ?? null,
    bio: (c.bio as Record<string, unknown>) ?? {},
  };
}
