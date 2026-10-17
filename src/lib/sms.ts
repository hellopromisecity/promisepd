/** Khudebarta SMS gateway — investor transaction notifications.
 *
 *  A GET to the gateway with apikey / secretkey / callerID / toUser /
 *  messageContent (the vendor's documented form; the legacy FastAPI service
 *  used the same). BD numbers only, "+" stripped. The API key + secret are
 *  SECRETS and come from the environment only (never committed); the gateway
 *  URL + sender id have safe defaults but can be overridden via env.
 *
 *  2026-10-17 — why nobody got a text for weeks while the SMS page looked
 *  normal: the default URL was the bare IP 118.67.213.114:3775. Khudebarta
 *  moved (portal.khudebarta.com now resolves to 161.248.247.60), every send
 *  got ECONNREFUSED, and this file swallowed the error and still logged the
 *  SMS as sent. Now:
 *    • the gateway is addressed by HOSTNAME (an old env var still pointing at
 *      the dead IP is ignored), with the current IP as a last-resort fallback;
 *    • the gateway's JSON verdict is READ — Status "0" = accepted, anything
 *      else = rejected with its reason — HTTP 200 alone means nothing;
 *    • a network failure is retried once, then tried on the next address;
 *    • every outcome is logged with its status (migration 0035), a failure is
 *      written to the Audit log, and callers get the result so the manager
 *      sees "SMS FAILED: …" on the spot instead of silence. */

import { getAdmin, logAudit } from "@/lib/admin-guard";

/** Addresses that no longer exist — ignored even if an env var names them. */
const DEAD_HOSTS = new Set(["118.67.213.114"]);
/** Hostname first (DNS follows the vendor), today's IP only as a fallback. */
const DEFAULT_URLS = ["http://portal.khudebarta.com:3775/sendtext", "http://161.248.247.60:3775/sendtext"];
const CALLER_ID = process.env.KHUDEBARTA_CALLER_ID || "PromiseCity";
const API_KEY = process.env.KHUDEBARTA_API_KEY;
const SECRET_KEY = process.env.KHUDEBARTA_SECRET_KEY;
const TIMEOUT_MS = 10_000;

export type SmsResult =
  | { ok: true; to: string; messageId: string | null }
  | { ok: false; to: string | null; error: string; /** no attempt was made (no BD number / SMS disabled) */ skipped?: boolean };

/** Gateway URLs to try, in order: KHUDEBARTA_API_URL (comma-separated allowed)
 *  then the defaults, minus anything pointing at a dead host. */
function candidateUrls(): string[] {
  const env = (process.env.KHUDEBARTA_API_URL || "").split(",").map((s) => s.trim()).filter(Boolean);
  const out: string[] = [];
  for (const u of [...env, ...DEFAULT_URLS]) {
    try { if (DEAD_HOSTS.has(new URL(u).hostname)) continue; } catch { continue; }
    if (!out.includes(u)) out.push(u);
  }
  return out;
}

/** Normalise a BD mobile to the gateway's "8801XXXXXXXXX" form. Handles local
 *  "01XXXXXXXXX" (how the project-book customers are stored), "+8801…", "8801…",
 *  and a field holding two numbers ("019… 018…"). Returns "" if none is valid. */
function bdMsisdn(phone: string | null | undefined): string {
  for (const chunk of String(phone || "").split(/[^\d+]+/)) {
    let d = chunk.replace(/\D/g, "");
    if (d.length === 11 && d.startsWith("0")) d = "88" + d;       // 01XXXXXXXXX → 8801XXXXXXXXX
    else if (d.length === 10 && d.startsWith("1")) d = "880" + d; // 1XXXXXXXXX  → 8801XXXXXXXXX
    if (/^8801[1-9]\d{8}$/.test(d)) return d;
  }
  return "";
}

/** True when a valid Bangladeshi mobile can be extracted from the field. */
function isBdNumber(phone: string): boolean {
  return bdMsisdn(phone) !== "";
}

/** "8801767682381" → "01767682381" for messages people read. */
export const smsLocal = (msisdn: string) => (msisdn.startsWith("880") ? "0" + msisdn.slice(3) : msisdn);

/** The number a BOOK customer's texts go to: the linked app account's CURRENT
 *  number when it is a real one (the login the owner keeps up to date — if
 *  they change it, texts follow), else the number written on the book row. */
export async function smsRecipientFor(row: { investor_uid?: string | null; mobile?: string | null }): Promise<string | null> {
  if (row.investor_uid) {
    try {
      const admin = getAdmin();
      if (admin) {
        const { data } = await admin.from("investor_accounts").select("phone_number").eq("uid", row.investor_uid).maybeSingle();
        const p = (data as { phone_number?: string | null } | null)?.phone_number ?? "";
        if (p && !/^(book|del):/i.test(p) && bdMsisdn(p)) return p;
      }
    } catch { /* fall back to the book number */ }
  }
  return row.mobile ?? null;
}

/** Record the outcome for the dashboard usage/cost tracker. Logging must
 *  never break the surrounding send, so every failure is swallowed. Writes
 *  the 0035 columns (status / error / message_id / message) and falls back to
 *  the original three when the migration hasn't run yet. */
async function logSms(recipient: string, message: string, kind: string, status: "sent" | "failed", error: string | null, messageId: string | null): Promise<void> {
  try {
    const admin = getAdmin();
    if (!admin) return;
    const unicode = [...message].some((ch) => ch.charCodeAt(0) > 127);
    const segments = Math.max(1, Math.ceil(message.length / (unicode ? 70 : 160)));
    const base = { recipient, kind, segments };
    // sms_log isn't in the generated Supabase types — write around them.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = () => admin.from("sms_log") as any;
    const { error: e1 } = await table().insert({ ...base, status, error: error ? error.slice(0, 300) : null, message_id: messageId, message: message.slice(0, 300) });
    if (e1 && /column|schema cache/i.test(String(e1.message))) await table().insert(base); // pre-0035
  } catch { /* ignore */ }
}

type GatewayReply = { reached: boolean; ok: boolean; messageId: string | null; error: string; raw: string };

/** One request to one gateway address. `reached` = the gateway answered at
 *  all (so retrying elsewhere is pointless); `ok` = it ACCEPTED the message. */
async function callGateway(url: string, toUser: string, message: string): Promise<GatewayReply> {
  const u = new URL(url);
  u.searchParams.set("apikey", API_KEY ?? "");
  u.searchParams.set("secretkey", SECRET_KEY ?? "");
  u.searchParams.set("callerID", CALLER_ID);
  u.searchParams.set("toUser", toUser);
  u.searchParams.set("messageContent", message);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(u, { method: "GET", signal: ctrl.signal, cache: "no-store" });
    const raw = (await res.text()).slice(0, 500);
    let body: Record<string, unknown> | null = null;
    try { body = JSON.parse(raw) as Record<string, unknown>; } catch { body = null; }
    // {"Status":"0","StatusDescription":"","Text":"ACCEPTD","Message_ID":"44373942"} on success;
    // {"Status":"-1","StatusDescription":"Org Client Not Found","Text":"REJECTD",…} on a bad key —
    // both with HTTP 200, so only the body counts.
    const status = body ? String(body.Status ?? body.status ?? "") : "";
    if (status === "0") return { reached: true, ok: true, messageId: body?.Message_ID != null ? String(body.Message_ID) : null, error: "", raw };
    const desc = body ? String(body.StatusDescription || body.Text || body.message || "") : "";
    return {
      reached: true, ok: false, messageId: null, raw,
      error: body ? `gateway rejected it (Status ${status || "?"}${desc ? `: ${desc}` : ""})` : `unexpected reply (HTTP ${res.status}): ${raw.slice(0, 120) || "empty"}`,
    };
  } catch (e) {
    const code = (e as Error & { cause?: { code?: string } })?.cause?.code;
    const msg = (e as Error)?.name === "AbortError" ? "timed out" : code || (e as Error)?.message || "network error";
    return { reached: false, ok: false, messageId: null, error: `cannot reach ${u.host} (${msg})`, raw: "" };
  } finally {
    clearTimeout(timer);
  }
}

async function sendSms(phone: string, message: string, kind = "transaction"): Promise<SmsResult> {
  if (!API_KEY || !SECRET_KEY) {
    console.warn("[sms] disabled — KHUDEBARTA_API_KEY / KHUDEBARTA_SECRET_KEY not set");
    return { ok: false, to: null, error: "SMS is switched off on the server (gateway keys not set)", skipped: true };
  }
  const toUser = bdMsisdn(phone);
  if (!toUser) return { ok: false, to: null, error: "no valid Bangladeshi mobile", skipped: true };

  let last: GatewayReply = { reached: false, ok: false, messageId: null, error: "no gateway address configured", raw: "" };
  outer: for (const url of candidateUrls()) {
    for (let attempt = 0; attempt < 2; attempt++) {
      last = await callGateway(url, toUser, message);
      if (last.ok) {
        await logSms(toUser, message, kind, "sent", null, last.messageId);
        return { ok: true, to: toUser, messageId: last.messageId };
      }
      if (last.reached) break outer; // it answered and said no — another address or retry won't change that
      await new Promise((r) => setTimeout(r, 400)); // transient network hiccup → one retry, then next address
    }
  }
  console.error("[sms] FAILED", { to: toUser, kind, error: last.error, raw: last.raw });
  await logSms(toUser, message, kind, "failed", last.error, null);
  await logAudit({ action: "sms", entity: "sms_gateway", entityId: toUser, detail: `SMS to ${smsLocal(toUser)} FAILED (${kind}): ${last.error}` });
  return { ok: false, to: toUser, error: last.error };
}

/** Text a password-reset code.  BD numbers only (gateway limit); anything
 *  else is silently skipped.  Never throws. */
export async function sendResetCodeSms(phone: string, code: string): Promise<void> {
  if (!isBdNumber(phone)) return;
  await sendSms(
    phone,
    `Your PromisePD password reset code is ${code}. It expires in 10 minutes. Do not share it with anyone.`,
    "reset",
  );
}

/** Send a free-form message to one recipient (bulk / profit push). The result
 *  says whether the gateway ACCEPTED it, rejected it, or no attempt was made
 *  (no usable mobile → `skipped`). Never throws. */
export async function sendBulkSms(phone: string | null | undefined, message: string, kind = "bulk"): Promise<SmsResult> {
  if (!isBdNumber(String(phone ?? ""))) return { ok: false, to: null, error: "no valid Bangladeshi mobile", skipped: true };
  return sendSms(String(phone), message, kind);
}

/** Text an investor about a transaction (credit/debit). BD numbers only;
 *  anything else is skipped. Never throws — the result tells the caller
 *  whether the customer will actually get the text. */
export async function sendTransactionSms(opts: {
  phone: string | null | undefined;
  operator: string; // "+" | "-"
  amount: number;
  txId: string;
}): Promise<SmsResult> {
  const phone = opts.phone ?? "";
  if (!isBdNumber(phone)) return { ok: false, to: null, error: "no valid Bangladeshi mobile", skipped: true };
  const amountStr = `BDT ${Number(opts.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const message =
    opts.operator === "-"
      ? `${amountStr} has been debited from your account. Ref: ${opts.txId}`
      : `${amountStr} has been credited to your account. Ref: ${opts.txId}`;
  return sendSms(phone, message, "transaction");
}

/** One line for the manager's toast / the action message. */
export function smsNote(r: SmsResult): string {
  if (r.ok) return ` · SMS sent to ${smsLocal(r.to)}`;
  if (r.skipped) return ` · no SMS (${r.error})`;
  return ` · SMS FAILED${r.to ? ` to ${smsLocal(r.to)}` : ""}: ${r.error}`;
}
