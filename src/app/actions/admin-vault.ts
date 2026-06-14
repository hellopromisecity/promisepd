"use server";

/** Secure Vault Server Actions — CRUD over public.vault_credentials.
 *
 *  Stores company logins (hosting, analytics, Supabase, registrar…).
 *  Every call: requireManager() → getAdmin() (service role) → write →
 *  logAudit() → revalidate.  The table is service-role-only (RLS), so
 *  the browser never touches it directly; all access flows through here.
 *
 *  Audit details NEVER include the password — only which site changed. */

import { revalidatePath } from "next/cache";
import {
  getAdmin,
  logAudit,
  requireManager,
  runAction,
  ValidationError,
  type ActionResult,
} from "@/lib/admin-guard";

export type VaultCredential = {
  id: string;
  site_name: string;
  site_url: string | null;
  login_url: string | null;
  username: string | null;
  password: string | null;
  notes: string | null;
};

export type VaultInput = {
  site_name: string;
  site_url?: string;
  login_url?: string;
  username?: string;
  password?: string;
  notes?: string;
};

const trimOrNull = (v: string | undefined): string | null => {
  const t = (v ?? "").trim();
  return t.length ? t : null;
};

/** Manager+ only.  Returns [] when Supabase isn't configured. */
export async function listCredentials(): Promise<VaultCredential[]> {
  try {
    await requireManager();
  } catch {
    return [];
  }
  const admin = getAdmin();
  if (!admin) return [];
  const { data, error } = await admin
    .from("vault_credentials")
    .select("id, site_name, site_url, login_url, username, password, notes")
    .order("site_name", { ascending: true });
  if (error || !data) return [];
  return data as VaultCredential[];
}

function buildRow(input: VaultInput) {
  const site_name = (input.site_name ?? "").trim();
  if (!site_name) throw new ValidationError("Site name is required.");
  return {
    site_name,
    site_url: trimOrNull(input.site_url),
    login_url: trimOrNull(input.login_url),
    username: trimOrNull(input.username),
    password: trimOrNull(input.password),
    notes: trimOrNull(input.notes),
  };
}

export async function createCredential(input: VaultInput): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    await requireManager();
    const admin = getAdmin();
    if (!admin) throw new ValidationError("Database is not configured.");

    const row = buildRow(input);
    const { data, error } = await admin
      .from("vault_credentials")
      .insert(row)
      .select("id")
      .single();
    if (error || !data) throw error ?? new Error("Insert returned no row.");

    await logAudit({ action: "create", entity: "vault_credential", entityId: data.id, detail: `Added vault entry “${row.site_name}”` });
    revalidatePath("/dashboard/vault");
    return { data: { id: data.id }, message: "Credential saved." };
  });
}

export async function updateCredential(id: string, input: VaultInput): Promise<ActionResult> {
  return runAction(async () => {
    await requireManager();
    if (!id) throw new ValidationError("Missing id.");
    const admin = getAdmin();
    if (!admin) throw new ValidationError("Database is not configured.");

    const row = buildRow(input);
    const { error } = await admin.from("vault_credentials").update(row).eq("id", id);
    if (error) throw error;

    await logAudit({ action: "update", entity: "vault_credential", entityId: id, detail: `Updated vault entry “${row.site_name}”` });
    revalidatePath("/dashboard/vault");
    return { message: "Credential updated." };
  });
}

export async function deleteCredential(id: string): Promise<ActionResult> {
  return runAction(async () => {
    await requireManager();
    if (!id) throw new ValidationError("Missing id.");
    const admin = getAdmin();
    if (!admin) throw new ValidationError("Database is not configured.");

    const { data: existing } = await admin
      .from("vault_credentials")
      .select("site_name")
      .eq("id", id)
      .maybeSingle();
    const { error } = await admin.from("vault_credentials").delete().eq("id", id);
    if (error) throw error;

    await logAudit({
      action: "delete",
      entity: "vault_credential",
      entityId: id,
      detail: existing ? `Deleted vault entry “${existing.site_name}”` : `Deleted vault entry ${id}`,
    });
    revalidatePath("/dashboard/vault");
    return { message: "Credential deleted." };
  });
}
