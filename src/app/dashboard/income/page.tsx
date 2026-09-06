import { redirect } from "next/navigation";

/** The July income page moved into the Finance module (2026-09-06). */
export default function LegacyIncomeRedirect() {
  redirect("/dashboard/finance/income");
}
