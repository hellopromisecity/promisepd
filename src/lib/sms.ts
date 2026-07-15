/** Khudebarta SMS gateway — investor transaction notifications.
 *
 *  Faithful port of the legacy FastAPI notification service: a GET to the
 *  gateway with apikey / secretkey / callerID / toUser / messageContent, BD
 *  numbers only, "+" stripped from the number.  The API key + secret are
 *  SECRETS and come from the environment only (never committed); the gateway
 *  URL + sender id have safe defaults but can be overridden via env too. */

import { getAdmin } from "@/lib/admin-guard";

const API_URL = process.env.KHUDEBARTA_API_URL || "http://118.67.213.114:3775/sendtext";
const CALLER_ID = process.env.KHUDEBARTA_CALLER_ID || "PromiseCity";
const API_KEY = process.env.KHUDEBARTA_API_KEY;
const SECRET_KEY = process.env.KHUDEBARTA_SECRET_KEY;
const TIMEOUT_MS = 10_000;

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

/** Record a sent SMS for the dashboard usage/cost tracker. Logging must never
 *  break the surrounding send, so every failure is swallowed. */
async function logSms(recipient: string, message: string, kind: string): Promise<void> {
  try {
    const admin = getAdmin();
    if (!admin) return;
    const unicode = [...message].some((ch) => ch.charCodeAt(0) > 127);
    const segments = Math.max(1, Math.ceil(message.length / (unicode ? 70 : 160)));
    // sms_log isn't in the generated Supabase types — write around them.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from("sms_log") as any).insert({ recipient, kind, segments });
  } catch { /* ignore */ }
}

async function sendSms(phone: string, message: string, kind = "transaction"): Promise<void> {
  if (!API_KEY || !SECRET_KEY) {
    console.warn("[sms] disabled — KHUDEBARTA_API_KEY / KHUDEBARTA_SECRET_KEY not set");
    return;
  }
  const toUser = bdMsisdn(phone);
  if (!toUser) return;
  const url = new URL(API_URL);
  url.searchParams.set("apikey", API_KEY);
  url.searchParams.set("secretkey", SECRET_KEY);
  url.searchParams.set("callerID", CALLER_ID);
  url.searchParams.set("toUser", toUser);
  url.searchParams.set("messageContent", message);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    await fetch(url, { method: "GET", signal: ctrl.signal, cache: "no-store" });
  } catch (e) {
    // Never let SMS failure break the surrounding action.
    console.error("[sms] send failed:", (e as Error)?.message ?? e);
  } finally {
    clearTimeout(timer);
  }
  await logSms(toUser, message, kind);
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

/** Send a free-form message to one recipient (bulk / profit push). Returns true
 *  when a valid BD number was found and the send attempted, false when skipped
 *  (no usable mobile). Never throws. */
export async function sendBulkSms(phone: string | null | undefined, message: string, kind = "bulk"): Promise<boolean> {
  if (!isBdNumber(String(phone ?? ""))) return false;
  await sendSms(String(phone), message, kind);
  return true;
}

/** Text an investor about a transaction (credit/debit). BD numbers only;
 *  anything else is silently skipped.  Never throws. */
export async function sendTransactionSms(opts: {
  phone: string | null | undefined;
  operator: string; // "+" | "-"
  amount: number;
  txId: string;
}): Promise<void> {
  const phone = opts.phone ?? "";
  if (!isBdNumber(phone)) return;
  const amountStr = `BDT ${Number(opts.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const message =
    opts.operator === "-"
      ? `${amountStr} has been debited from your account. Ref: ${opts.txId}`
      : `${amountStr} has been credited to your account. Ref: ${opts.txId}`;
  await sendSms(phone, message, "transaction");
}
