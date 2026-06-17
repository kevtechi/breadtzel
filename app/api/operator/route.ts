import { beginSpin, completeReveal, startNewRound } from "@/lib/store";
import { isAdminAuthed } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAdminAuthed())) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    actualWeight?: number;
  };

  switch (body.action) {
    case "spin": {
      const w = body.actualWeight;
      if (typeof w !== "number" || !(w > 0)) {
        return Response.json({ error: "invalid actualWeight" }, { status: 400 });
      }
      await beginSpin(w);
      break;
    }
    case "reveal":
      await completeReveal();
      break;
    case "reset":
      await startNewRound();
      break;
    default:
      return Response.json({ error: "unknown action" }, { status: 400 });
  }

  return Response.json({ ok: true });
}
