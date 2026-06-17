import { getState } from "@/lib/store";

// Live data — never cache.
export const dynamic = "force-dynamic";

export async function GET() {
  const state = await getState();
  return Response.json(state);
}
