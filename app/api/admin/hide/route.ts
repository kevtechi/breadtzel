import { setHidden } from "@/lib/store";
import { isAdminAuthed } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAdminAuthed())) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    entryId?: string;
    hidden?: boolean;
  };
  if (typeof body.entryId !== "string" || typeof body.hidden !== "boolean") {
    return Response.json({ error: "invalid request" }, { status: 400 });
  }
  await setHidden(body.entryId, body.hidden);
  return Response.json({ ok: true });
}
