/** Bank accounts shown on the public /payment page. Order + values are the
 *  authoritative list — account & routing numbers must match exactly. */

export type BankAccount = {
  holder: string;
  bank: string;
  branch: string;
  account: string;
  routing: string;
  /** Brand-ish accent colour for the card header. */
  accent: string;
};

export const BANK_ACCOUNTS: BankAccount[] = [
  {
    holder: "Promise Proper Development Ltd.",
    bank: "Dutch-Bangla Bank",
    branch: "Jatrabari Sub-branch, Dhaka",
    account: "1191100033511",
    routing: "090271423",
    accent: "#1a4fa0",
  },
  {
    holder: "Kamrul Hasan",
    bank: "Dutch-Bangla Bank",
    branch: "Mohammadpur Branch, Dhaka",
    account: "2581510021266",
    routing: "090263286",
    accent: "#1a4fa0",
  },
  {
    holder: "Kamrul Hasan",
    bank: "Al-Arafah Islami Bank",
    branch: "Mohammadpur Krishi Market Branch, Dhaka",
    account: "0371120128423",
    routing: "015263379",
    accent: "#0b6e4f",
  },
  {
    holder: "Kamrul Hasan",
    bank: "Sonali Bank",
    branch: "Jatrabari Branch, Dhaka",
    account: "1610501010877",
    routing: "200273224",
    accent: "#b8860b",
  },
  {
    holder: "Kamrul Hasan",
    bank: "Islami Bank Bangladesh",
    branch: "Jatrabari Branch, Dhaka",
    account: "20502040206220408",
    routing: "125273220",
    accent: "#0e7a3b",
  },
  {
    holder: "Kamrul Hasan",
    bank: "Bank Asia",
    branch: "Jatrabari Branch, Dhaka",
    account: "15234006183",
    routing: "070273238",
    accent: "#c8102e",
  },
];
