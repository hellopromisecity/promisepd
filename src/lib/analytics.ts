/** Google Analytics 4 (Data API) + Search Console reader for the admin
 *  Analytics dashboard.  Reads a service account from env; if it isn't
 *  configured the page shows a "connect" setup card instead.
 *
 *  Required env (all server-only):
 *    GA4_PROPERTY_ID         numeric GA4 property id (e.g. 123456789)
 *    GOOGLE_CLIENT_EMAIL     service-account email
 *    GOOGLE_PRIVATE_KEY      service-account private key (\n-escaped)
 *    SEARCH_CONSOLE_SITE_URL (optional) e.g. https://promisecity.vercel.app/
 *                            or sc-domain:promisepd.com
 *
 *  The service account needs Viewer on the GA4 property and access to
 *  the Search Console property. */

import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { JWT } from "google-auth-library";
import { type DateRange } from "./analytics-shared";

export { RANGE_LABELS, type DateRange } from "./analytics-shared";

export type AnalyticsData = {
  totals: { users: number; newUsers: number; sessions: number; pageViews: number };
  today: number;
  last7: number;
  daily: { date: string; users: number }[];
  topPages: { path: string; title: string; views: number }[];
  topCountries: { country: string; users: number }[];
  topQueries: { query: string; clicks: number; impressions: number; ctr: number; position: number }[];
  topSearchPages: { page: string; clicks: number; impressions: number; position: number }[];
  searchConsole: boolean;
};

function creds() {
  const propertyId = process.env.GA4_PROPERTY_ID;
  const client_email = process.env.GOOGLE_CLIENT_EMAIL;
  const private_key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!propertyId || !client_email || !private_key) return null;
  return { propertyId, client_email, private_key, scSite: process.env.SEARCH_CONSOLE_SITE_URL };
}

export const analyticsConfigured = () => !!creds();

const fmt = (d: Date) => d.toISOString().slice(0, 10);

function rangeDates(r: DateRange): { start: string; end: string } {
  const today = new Date();
  const end = new Date(today);
  let start = new Date(today);
  if (r === "7d") start.setDate(today.getDate() - 6);
  else if (r === "30d") start.setDate(today.getDate() - 29);
  else if (r === "365d") start.setDate(today.getDate() - 364);
  else if (r === "thismonth") start = new Date(today.getFullYear(), today.getMonth(), 1);
  else if (r === "lastmonth") {
    start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    end.setTime(new Date(today.getFullYear(), today.getMonth(), 0).getTime());
  } else start = new Date(2018, 0, 1); // lifetime
  return { start: fmt(start), end: fmt(end) };
}

const n = (v: unknown) => Number(v) || 0;

async function searchConsole(c: NonNullable<ReturnType<typeof creds>>, start: string, end: string) {
  if (!c.scSite) return { topQueries: [], topSearchPages: [], ok: false };
  try {
    const jwt = new JWT({ email: c.client_email, key: c.private_key, scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
    const { access_token } = await jwt.authorize();
    const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(c.scSite)}/searchAnalytics/query`;
    const call = async (dimension: "query" | "page") => {
      const r = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: start, endDate: end, dimensions: [dimension], rowLimit: 25 }),
      });
      const j = await r.json();
      return (j.rows ?? []) as { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[];
    };
    const [q, p] = await Promise.all([call("query"), call("page")]);
    return {
      ok: true,
      topQueries: q.map((row) => ({ query: row.keys[0], clicks: n(row.clicks), impressions: n(row.impressions), ctr: n(row.ctr), position: n(row.position) })),
      topSearchPages: p
        .map((row) => ({ page: row.keys[0], clicks: n(row.clicks), impressions: n(row.impressions), position: n(row.position) }))
        .sort((a, b) => b.clicks - a.clicks),
    };
  } catch (e) {
    console.error("[analytics] search console", e);
    return { topQueries: [], topSearchPages: [], ok: false };
  }
}

export async function getAnalytics(range: DateRange): Promise<AnalyticsData | null> {
  const c = creds();
  if (!c) return null;
  const { start, end } = rangeDates(range);
  try {
    const client = new BetaAnalyticsDataClient({ credentials: { client_email: c.client_email, private_key: c.private_key } });
    const property = `properties/${c.propertyId}`;
    const dateRanges = [{ startDate: start, endDate: end }];

    const [resp] = await client.batchRunReports({
      property,
      requests: [
        { dateRanges, dimensions: [{ name: "date" }], metrics: [{ name: "activeUsers" }], orderBys: [{ dimension: { dimensionName: "date" } }] },
        { dateRanges, metrics: [{ name: "activeUsers" }, { name: "newUsers" }, { name: "sessions" }, { name: "screenPageViews" }] },
        { dateRanges, dimensions: [{ name: "pagePath" }, { name: "pageTitle" }], metrics: [{ name: "screenPageViews" }], orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }], limit: 25 },
        { dateRanges, dimensions: [{ name: "country" }], metrics: [{ name: "activeUsers" }], orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }], limit: 25 },
      ],
    });
    const reports = resp.reports ?? [];

    const daily = (reports[0]?.rows ?? []).map((row) => ({
      date: row.dimensionValues?.[0]?.value ?? "",
      users: n(row.metricValues?.[0]?.value),
    }));
    const t = reports[1]?.rows?.[0]?.metricValues ?? [];
    const totals = { users: n(t[0]?.value), newUsers: n(t[1]?.value), sessions: n(t[2]?.value), pageViews: n(t[3]?.value) };
    const today = daily.length ? daily[daily.length - 1].users : 0;
    const last7 = daily.slice(-7).reduce((s, d) => s + d.users, 0);
    const topPages = (reports[2]?.rows ?? []).map((row) => ({
      path: row.dimensionValues?.[0]?.value ?? "",
      title: row.dimensionValues?.[1]?.value ?? "",
      views: n(row.metricValues?.[0]?.value),
    }));
    const topCountries = (reports[3]?.rows ?? []).map((row) => ({
      country: row.dimensionValues?.[0]?.value ?? "",
      users: n(row.metricValues?.[0]?.value),
    }));

    const sc = await searchConsole(c, start, end);

    return { totals, today, last7, daily, topPages, topCountries, topQueries: sc.topQueries, topSearchPages: sc.topSearchPages, searchConsole: sc.ok };
  } catch (e) {
    console.error("[analytics] GA4", e);
    return null;
  }
}
