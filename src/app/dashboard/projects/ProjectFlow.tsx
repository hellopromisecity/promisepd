"use client";

/** Project page "Monthly flow" card — the same In / Out / Net chart as the
 *  Dashboard's Capital flow, fed with this one project's book payments
 *  (deposits + profit in, withdrawals out), bucketed per month on the server
 *  by hubProjectMonthlyFlow(). Client-side only for the fade-in + hover. */

import { useEffect, useState } from "react";
import FlowChart, { type FlowBar } from "@/components/admin/FlowChart";

export default function ProjectFlow({ bars, count, subtitle }: { bars: FlowBar[]; count: number; subtitle: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setOn(true), 40); return () => clearTimeout(t); }, []);
  return <FlowChart flow={bars} on={on} title="Monthly flow" subtitle={subtitle} count={count} gradientId="projFlowIn" height={210} />;
}
