import { NextRequest, NextResponse } from "next/server";
import { importSquadding, importSchedule, importAthScheduleIndy, importVolScheduleIndy, importRef, clearEventData } from "@/lib/import-actions";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { eventId: string } }) {
  const { eventId } = params;

  // Verify event exists
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  try {
    const { type, tsv, clearFirst } = await req.json();
    if (!tsv) return NextResponse.json({ error: "tsv is required" }, { status: 400 });

    if (clearFirst) {
      await clearEventData(eventId);
    }

    let result;
    switch (type) {
      case "squadding":
        result = await importSquadding(eventId, tsv);
        break;
      case "schedule":
        result = await importSchedule(eventId, tsv);
        break;
      case "ath_schedule":
        result = await importAthScheduleIndy(eventId, tsv);
        break;
      case "vol_schedule":
        result = await importVolScheduleIndy(eventId, tsv);
        break;
      case "ref":
        result = await importRef(eventId, tsv);
        break;
      default:
        return NextResponse.json({ error: "Unknown import type" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: "Import completed successfully" });
  } catch (err: unknown) {
    console.error("Import error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Import failed" }, { status: 500 });
  }
}
