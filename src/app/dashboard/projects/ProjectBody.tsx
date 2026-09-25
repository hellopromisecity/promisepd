"use client";

/** Glue between the insight panels and the customer table on a project
 *  page: clicking a "New customers" tower selects that month, and the table
 *  below shows only the customers who joined then (click again, or the ✕
 *  chip on the table, to clear). Pure client state — nothing is refetched. */

import { useMemo, useState } from "react";
import type { HubCustomer } from "@/lib/hub";
import RealEstateInsights, { type InsightMode } from "./RealEstateInsights";
import HubCustomerList, { type HubProject } from "./HubCustomerList";

export default function ProjectBody({ customers, mode, accrued, details, between, project, profits }: {
  customers: HubCustomer[];
  mode: InsightMode;
  accrued: number;
  details: React.ReactNode;
  /** Rendered between the insights and the table (the deposit profit panel). */
  between?: React.ReactNode;
  project: HubProject;
  profits?: Record<string, number>;
}) {
  const [month, setMonth] = useState<{ key: string; label: string } | null>(null);
  const shown = useMemo(() => (month ? customers.filter((c) => (c.joining_date ?? "").startsWith(month.key)) : customers), [customers, month]);
  const noun = mode === "deposit" ? "members" : "customers";
  return (
    <>
      <RealEstateInsights
        customers={customers}
        mode={mode}
        accrued={accrued}
        details={details}
        activeMonth={month?.key ?? null}
        onMonthClick={(key, label) => setMonth((m) => (m?.key === key ? null : { key, label }))}
      />
      {between}
      <HubCustomerList
        customers={shown}
        project={project}
        profits={profits}
        filterNote={month ? { label: `Joined ${month.label} · ${shown.length} ${noun}`, onClear: () => setMonth(null) } : undefined}
      />
    </>
  );
}
