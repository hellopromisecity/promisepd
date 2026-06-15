/** Khudebarta SMS gateway — investor transaction notifications.
 *
 *  Faithful port of the legacy FastAPI notification service: a GET to the
 *  gateway with apikey / secretkey / callerID / toUser / messageContent, BD
 *  numbers only, "+" stripped from the number.  The API key + secret are
 *  SECRETS and come from the environment only (never committed); the gateway
 *  URL + sender id have safe defaults but can be overridden via env too. */

const API_URL = process.env.KHUDEBARTA_API_URL || "http://118.67.213.114:3775/sendtext";
const CALLER_ID = process.env.KHUDEBARTA_CALLER_ID || "PromiseCity";
const API_KEY = process.env.KHUDEBARTA_API_KEY;
const SECRET_KEY = process.env.KHUDEBARTA_SECRET_KEY;
const TIMEOUT_MS = 10_000;

/** Bangladeshi mobile in +8801XXXXXXXXX form (matches the legacy regex). */
function isBdNumber(phone: string): boolean {
  return /^\+?8801[1-9]\d{8}$/.test((phone || "").replace(/\s/g, ""));
}

async function sendSms(phone: string, message: string): Promise<void> {
  if (!API_KEY || !SECRET_KEY) {
    console.warn("[sms] disabled — KHUDEBARTA_API_KEY / KHUDEBARTA_SECRET_KEY not set");
    return;
  }
  const toUser = (phone.startsWith("+") ? phone.slice(1) : phone).replace(/\s/g, "");
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
  await sendSms(phone, message);
}
