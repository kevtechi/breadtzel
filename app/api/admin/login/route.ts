import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  ADMIN_MAX_AGE,
  adminProtected,
  adminToken,
  verifyCode,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // No code configured → admin is open; treat login as a no-op success.
  if (!adminProtected()) return Response.json({ ok: true, open: true });

  const body = (await request.json().catch(() => ({}))) as { code?: string };
  if (!verifyCode(body.code)) {
    return Response.json({ error: "invalid code" }, { status: 401 });
  }

  (await cookies()).set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_MAX_AGE,
  });
  return Response.json({ ok: true });
}

export async function DELETE() {
  (await cookies()).delete(ADMIN_COOKIE);
  return Response.json({ ok: true });
}
