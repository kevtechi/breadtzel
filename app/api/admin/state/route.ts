import { getAdminState } from "@/lib/store";
import { isAdminAuthed } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// Admin view of the round — includes hidden guesses so they can be unhidden.
export async function GET() {
  if (!(await isAdminAuthed())) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return Response.json(await getAdminState());
}
