"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, isManager } from "@/lib/auth";
import { getAdmin, logAudit } from "@/lib/admin-guard";

type Result = { ok: true; message?: string } | { ok: false; error: string };

/** Update the SMS balance checkpoint and/or the per-SMS rate. Setting the
 *  balance stamps balance_at = now, so cost-since resets from this point. */
export async function updateSmsConfig(input: { balance?: number | null; rate?: number | null }): Promise<Result> {
  try {
    const me = await getCurrentUser();
    if (!me || !isManager(me.role)) return { ok: false, error: "Not allowed." };
    const admin = getAdmin();
    if (!admin) return { ok: false, error: "Database not configured." };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patch: any = { updated_at: new Date().toISOString() };
    const setBalance = input.balance != null && Number.isFinite(Number(input.balance));
    if (setBalance) { patch.balance = Number(input.balance); patch.balance_at = new Date().toISOString(); }
    if (input.rate != null && Number.isFinite(Number(input.rate)) && Number(input.rate) > 0) patch.rate = Number(input.rate);
    if (Object.keys(patch).length === 1) return { ok: false, error: "Nothing to update." };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin.from("sms_config") as any).update(patch).eq("id", 1);
    if (error) return { ok: false, error: error.message };

    await logAudit({ action: "update", entity: "sms_config", detail: setBalance ? `SMS balance set to ${patch.balance}` : "Updated SMS rate" });
    revalidatePath("/dashboard/sms");
    return { ok: true, message: setBalance ? "Balance updated." : "Rate saved." };
  } catch (e) { return { ok: false, error: (e as Error).message }; }
}
