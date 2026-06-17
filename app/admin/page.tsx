import { isAdminAuthed } from "@/lib/admin-auth";
import { AdminConsole } from "@/components/AdminConsole";
import { AdminLogin } from "@/components/AdminLogin";

// Always evaluated per-request so the cookie check is fresh.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authed = await isAdminAuthed();
  return authed ? <AdminConsole /> : <AdminLogin />;
}
