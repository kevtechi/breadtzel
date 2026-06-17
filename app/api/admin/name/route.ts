import { setName } from "@/lib/store";
import { isAdminAuthed } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAdminAuthed())) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    entryId?: string;
    displayName?: string;
  };

  if (typeof body.entryId !== "string" || !body.entryId) {
    return Response.json({ error: "invalid entryId" }, { status: 400 });
  }
  const name =
    typeof body.displayName === "string" ? body.displayName.trim().slice(0, 40) : "";
  if (!name) {
    return Response.json({ error: "empty displayName" }, { status: 400 });
  }

  await setName(body.entryId, name);
  return Response.json({ ok: true });
}
