/** Server-only helpers shared by every admin section's Server Actions.
 *
 *  - requireStaff/Manager/Admin(): assert the caller's role from the
 *    session and return their Member; throw (caught by the action) if
 *    not authorised.  Use at the top of every admin mutation.
 *  - getAdmin(): the service-role Supabase client (bypasses RLS).  All
 *    admin tables are service-role-only, so reads/writes go through this.
 *  - logAudit(): append a row to audit_logs (who did what).  Best-effort
 *    — never throws, so a logging hiccup can't break a real action. */

import { getCurrentUser, isStaff, isManager, isAdmin, type Member, type Role } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export class AuthzError extends Error {
  constructor(msg = "Not authorised") {
    super(msg);
    this.name = "AuthzError";
  }
}

/** A user-facing validation problem (bad input), as opposed to an
 *  unexpected server fault.  runAction() passes its message straight
 *  through so forms show "Slug is required" instead of the generic
 *  "Something went wrong." */
export class ValidationError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "ValidationError";
  }
}

export const getAdmin = createAdminClient;

async function requireRole(check: (r: Role) => boolean): Promise<Member> {
  const member = await getCurrentUser();
  if (!member) throw new AuthzError("Not signed in");
  if (!check(member.role)) throw new AuthzError("Insufficient role");
  return member;
}

export const requireStaff = () => requireRole(isStaff);
export const requireManager = () => requireRole(isManager);
export const requireAdmin = () => requireRole(isAdmin);

/** Only the env-designated owner / founder (SUPER_ADMIN_EMAILS).  Used for the
 *  most sensitive actions — changing roles — so even a second admin can't
 *  reshuffle the hierarchy. */
export async function requireOwner(): Promise<Member> {
  const member = await getCurrentUser();
  if (!member) throw new AuthzError("Not signed in");
  if (!member.isOwner) throw new AuthzError("Only the owner can change roles.");
  return member;
}

/** Append an audit-log entry.  Best-effort; swallows all errors. */
export async function logAudit(entry: {
  action: string;
  entity: string;
  entityId?: string | null;
  detail?: string | null;
  actor?: Pick<Member, "id" | "name"> | null;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    if (!admin) return;
    const actor = entry.actor ?? (await getCurrentUser());
    await admin.from("audit_logs").insert({
      actor_id: actor?.id ?? null,
      actor_name: actor?.name ?? null,
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entityId ?? null,
      detail: entry.detail ?? null,
    });
  } catch {
    /* logging must never break the real action */
  }
}

/** Field-by-field "label: old → new" lines for an audit detail — ONLY the
 *  fields that actually changed, one per line (the Audit log renders the
 *  newlines). Numbers compare numerically ("60000" = 60000 = "60000.00"),
 *  blanks show as "—", booleans as yes / no, objects as JSON. A key that
 *  looks like a secret (password / secret / token / pin) only ever says
 *  "changed". Returns "" when nothing changed. The MD reads this log to see
 *  exactly what each staff member did — so every save spells it out. */
export function diffDetail(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown>,
  labels: Record<string, string> = {},
  opts: { skip?: string[]; maxLen?: number } = {},
): string {
  const skip = new Set(["id", "created_at", "updated_at", ...(opts.skip ?? [])]);
  const maxLen = opts.maxLen ?? 90;
  const norm = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    if (typeof v === "boolean") return v ? "yes" : "no";
    if (typeof v === "number") return Number.isFinite(v) ? String(Math.round(v * 100) / 100) : "";
    if (typeof v === "object") return JSON.stringify(v);
    return String(v).trim();
  };
  const show = (s: string) => (s === "" ? "—" : s.length > maxLen ? `${s.slice(0, maxLen - 1)}…` : s);
  const lines: string[] = [];
  for (const key of Object.keys(after)) {
    if (skip.has(key)) continue;
    const a = norm(before?.[key]);
    const b = norm(after[key]);
    if (a === b) continue;
    if (a !== "" && b !== "" && !Number.isNaN(Number(a)) && !Number.isNaN(Number(b)) && Number(a) === Number(b)) continue;
    const label = labels[key] ?? key.replace(/_/g, " ");
    if (/password|secret|token|\bpin\b/i.test(key)) { lines.push(`${label}: changed`); continue; }
    lines.push(`${label}: ${show(a)} → ${show(b)}`);
  }
  return lines.join("\n");
}

/** "<headline>\n<changes>", or "<headline> (no field changed)" when the save
 *  touched nothing — the log still records that the attempt happened. */
export function withChanges(headline: string, changes: string): string {
  return changes ? `${headline}\n${changes}` : `${headline} (no field changed)`;
}

/** Standard shape Server Actions return to client forms. */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string };

/** Wrap a mutation: runs `fn`, maps AuthzError + thrown errors to a
 *  friendly ActionResult so client forms get a consistent shape. */
export async function runAction<T>(
  fn: () => Promise<{ data?: T; message?: string }>,
): Promise<ActionResult<T>> {
  try {
    const { data, message } = await fn();
    return { ok: true, data, message };
  } catch (e) {
    // Expected, user-facing problems surface their own message…
    if (e instanceof AuthzError || e instanceof ValidationError) {
      return { ok: false, error: e.message };
    }
    // …everything else is an unexpected fault — log it, show a generic note.
    console.error("[admin action]", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
