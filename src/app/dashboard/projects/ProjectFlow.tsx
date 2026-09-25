"use client";

/** Project page money-flow card — the Dashboard's Capital flow, fed with this
 *  one project's book payments (deposits + profit credits in, withdrawals
 *  out). Own date-range filter (presets / custom) and CSV export; the bucket
 *  size follows the range (daily / weekly / monthly) like the Dashboard. */

import { useEffect, useMemo, useState } from "react";
import FlowChart from "@/components/admin/FlowChart";
import DateRangeFilter, { DEFAULT_RANGE, type AppliedRange } from "@/components/admin/DateRangeFilter";
import { computeFlow, downloadFlowCsv, type FlowTxn } from "@/components/admin/flow";

export default function ProjectFlow({ txns, slug }: { txns: FlowTxn[]; slug: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setOn(true), 40); return () => clearTimeout(t); }, []);
  const [applied, setApplied] = useState<AppliedRange>(DEFAULT_RANGE);
  const flow = useMemo(() => computeFlow(txns, applied.from, applied.to), [txns, applied]);
  const title = flow.gran === "day" ? "Daily flow" : flow.gran === "week" ? "Weekly flow" : "Monthly flow";
  return (
    <FlowChart
      flow={flow.bars}
      on={on}
      title={title}
      subtitle={applied.label}
      count={flow.count}
      onExport={() => downloadFlowCsv(flow.bars, `${slug}-flow-${applied.label.replace(/[^\w]+/g, "-")}.csv`)}
      headerExtra={<DateRangeFilter compact applied={applied} onApply={setApplied} />}
      gradientId="projFlowIn"
      height={210}
    />
  );
}
