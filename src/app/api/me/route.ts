import { NextResponse } from "next/server";
import { getCurrentUser, isStaff } from "@/lib/auth";

/** Lightweight "who am I" for the navbar — lets the (static) header link
 *  straight to the right place (staff → /dashboard, members → /account)
 *  instead of bouncing everyone through /account first. */
export const dynamic = "force-dynamic";

export async function GET() {
  const member = await getCurrentUser();
  if (!member) return NextResponse.json({ authed: false });
  return NextResponse.json({
    authed: true,
    staff: isStaff(member.role),
    name: member.name,
  });
}
