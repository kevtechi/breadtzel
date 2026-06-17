// Server-only admin auth. A 6-digit ADMIN_CODE (in .env) gates the operator
// surface. Login verifies the code server-side and sets an httpOnly cookie
// holding sha256(code) — the raw code never lives in the cookie, and the
// cookie is never readable by client JS.
import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "breadtzel_admin";
export const ADMIN_MAX_AGE = 60 * 60 * 12; // 12h

function adminCode(): string | null {
  const c = process.env.ADMIN_CODE?.trim();
  return c ? c : null;
}

/** When no code is configured, the admin surface is open (dev/demo). */
export function adminProtected(): boolean {
  return adminCode() !== null;
}

/** Deterministic session token derived from the code. */
export function adminToken(): string {
  return createHash("sha256")
    .update(adminCode() ?? "")
    .digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Constant-time check of a submitted code against ADMIN_CODE. */
export function verifyCode(input: unknown): boolean {
  const code = adminCode();
  if (!code || typeof input !== "string") return false;
  return safeEqual(input, code);
}

/**
 * Whether the current request carries a valid admin cookie. Open (true) when
 * no ADMIN_CODE is configured. Usable in server components and route handlers.
 */
export async function isAdminAuthed(): Promise<boolean> {
  if (!adminProtected()) return true;
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  return value != null && safeEqual(value, adminToken());
}
