import type { Tone } from "@/components/admin/ui";

/** Statuses a client follow-up can be in.  Lives here (a plain module)
 *  rather than in the "use server" actions file, which may only export
 *  async functions. */
export const FOLLOWUP_STATUSES = [
  "new",
  "contacted",
  "interested",
  "negotiation",
  "closed_won",
  "closed_lost",
] as const;
export type FollowupStatus = (typeof FOLLOWUP_STATUSES)[number];

/** Human label + Badge tone for each follow-up status. */
export const STATUS_META: Record<FollowupStatus, { label: string; tone: Tone }> = {
  new: { label: "New", tone: "info" },
  contacted: { label: "Contacted", tone: "neutral" },
  interested: { label: "Interested", tone: "info" },
  negotiation: { label: "Negotiation", tone: "warning" },
  closed_won: { label: "Closed won", tone: "success" },
  closed_lost: { label: "Closed lost", tone: "danger" },
};
