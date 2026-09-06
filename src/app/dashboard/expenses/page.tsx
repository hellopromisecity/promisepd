import { redirect } from "next/navigation";

/** The July expenses page moved into the Finance module (2026-09-06). */
export default function LegacyExpensesRedirect() {
  redirect("/dashboard/finance/expense");
}
