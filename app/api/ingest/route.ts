import { LIVE_MODE } from "@/lib/config";

export const dynamic = "force-dynamic";

// Manual / cron trigger for chain ingestion. The display also ingests on poll,
// so this is optional — useful for a scheduled job or a kick after deploy.
export async function POST() {
  if (!LIVE_MODE) {
    return Response.json({ live: false, ingested: 0 });
  }
  const { ingestNewTransfers } = await import("@/lib/ingest");
  const ingested = await ingestNewTransfers();
  return Response.json({ live: true, ingested });
}
