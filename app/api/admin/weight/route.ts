import { setWeight } from "@/lib/store";
import { isAdminAuthed } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAdminAuthed())) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    entryId?: string;
    weightGuess?: number;
  };

  if (typeof body.entryId !== "string" || !body.entryId) {
    return Response.json({ error: "invalid entryId" }, { status: 400 });
  }
  const weight = Math.round(Number(body.weightGuess));
  if (!Number.isFinite(weight) || weight <= 0) {
    return Response.json({ error: "invalid weightGuess" }, { status: 400 });
  }

  await setWeight(body.entryId, weight);
  return Response.json({ ok: true });
}
