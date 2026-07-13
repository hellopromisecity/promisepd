"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, isManager } from "@/lib/auth";
import { getAdmin } from "@/lib/admin-guard";

type Result = { ok: true; message?: string } | { ok: false; error: string };
type Admin = NonNullable<ReturnType<typeof getAdmin>>;
const r2 = (n: unknown) => Math.round((Number(n) || 0) * 100) / 100;
// deposit_profit_config isn't in the generated Supabase types → loosen the builder for writes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PC = (a: Admin) => (a.from as any)("deposit_profit_config");

export type ProfitConfigInput = {
  enabled: boolean;
  per_lakh: number;
  cycle_days: number;
  cycle_start: string;
  payout_date: string;
  next_payout: string;
};

/** Upsert one scheme's profit rate. Changing it recomputes every member's
 *  current + projected profit on the next render (data is derived, not stored). */
export async function saveProfitConfig(projectKey: string, input: ProfitConfigInput): Promise<Result> {
  try {
    const me = await getCurrentUser();
    if (!me || !isManager(me.role)) return { ok: false, error: "Not allowed." };
    const admin = getAdmin();
    if (!admin) return { ok: false, error: "Database not configured." };
    if (!projectKey) return { ok: false, error: "Missing project." };
    if (input.enabled && !(Number(input.per_lakh) > 0)) return { ok: false, error: "Per-lakh rate must be greater than 0." };

    const payload = {
      project_key: projectKey,
      enabled: !!input.enabled,
      per_lakh: r2(input.per_lakh),
      cycle_days: Math.max(1, Math.round(Number(input.cycle_days) || 720)),
      cycle_start: input.cycle_start || null,
      payout_date: input.payout_date || null,
      next_payout: input.next_payout || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await PC(admin).upsert(payload, { onConflict: "project_key" });
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/dashboard/projects/${projectKey}`);
    return { ok: true, message: "Profit rate saved." };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
