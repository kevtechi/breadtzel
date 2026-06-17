import { setName } from "@/lib/store";
import { isAdminAuthed } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAdminAuthed())) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    address?: string;
    displayName?: string;
  };

  if (typeof body.address !== "string" || !/^0x[0-9a-fA-F]{40}$/.test(body.address)) {
    return Response.json({ error: "invalid address" }, { status: 400 });
  }
  const name =
    typeof body.displayName === "string" ? body.displayName.trim().slice(0, 40) : "";
  if (!name) {
    return Response.json({ error: "empty displayName" }, { status: 400 });
  }

  await setName(body.address, name);
  return Response.json({ ok: true });
}
