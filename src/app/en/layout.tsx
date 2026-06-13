import { LocaleProvider } from "@/components/LocaleProvider";

/** Everything under /en renders in English. The root layout still
 *  provides <html>, Navbar and Footer (which detect locale from the
 *  pathname); this nested layout just flips page-body content to
 *  English via the locale context. */
export default function EnLayout({ children }: { children: React.ReactNode }) {
  return <LocaleProvider locale="en">{children}</LocaleProvider>;
}
