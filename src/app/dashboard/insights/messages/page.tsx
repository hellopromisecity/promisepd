import { redirect } from "next/navigation";

// The Message box moved to /dashboard/report (renamed "Report" section).
export default function LegacyMessagesRedirect() {
  redirect("/dashboard/report");
}
