import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toCSV(rows: string[][], sep = ","): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? "");
          if (s.includes(sep) || s.includes('"') || s.includes("\n")) {
            return `"${s.replace(/"/g, '""')}"`;
          }
          return s;
        })
        .join(sep)
    )
    .join("\n");
}

export async function GET(req: NextRequest, { params }: { params: { eventId: string } }) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type") || "schedule";
  const format = searchParams.get("format") || "csv";
  const personId = searchParams.get("personId");
  const sep = format === "tsv" ? "\t" : ",";
  const ext = format === "tsv" ? "tsv" : "csv";

  const event = await prisma.event.findUnique({ where: { id: params.eventId } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  let rows: string[][] = [];

  if (type === "schedule") {
    const assignments = await prisma.athleteAssignment.findMany({
      where: { eventId: params.eventId },
      include: { flight: true, stage: true, person: true, discipline: true, squad: true },
      orderBy: [
        { flight: { flightOrder: "asc" } },
        { flight: { startTime: "asc" } },
        { relay: "asc" },
        { shootOrder: "asc" },
      ],
    });
    rows = [
      ["Flight", "Start Time", "Stage", "Athlete", "Discipline", "Squad #", "Squad Name", "Relay", "Relay Code", "Order"],
      ...assignments.map((a) => [
        a.flight.name,
        a.flight.startTime?.toLocaleString() ?? "",
        a.stage?.name ?? "",
        a.person.fullName,
        a.discipline?.name ?? "",
        a.squad?.squadNum?.toString() ?? "",
        a.squad?.squadName ?? "",
        a.relay?.toString() ?? "",
        a.relayCode ?? "",
        a.shootOrder?.toString() ?? "",
      ]),
    ];
  } else if (type === "athlete" && personId) {
    const person = await prisma.person.findUnique({ where: { id: personId } });
    if (!person) return NextResponse.json({ error: "Person not found" }, { status: 404 });
    const assignments = await prisma.athleteAssignment.findMany({
      where: { eventId: params.eventId, personId },
      include: { flight: true, stage: true, discipline: true, squad: true },
      orderBy: [{ flight: { flightOrder: "asc" } }, { flight: { startTime: "asc" } }],
    });
    rows = [
      ["Athlete", "Flight", "Start Time", "Stage", "Discipline", "Squad #", "Relay", "Order"],
      ...assignments.map((a) => [
        person.fullName,
        a.flight.name,
        a.flight.startTime?.toLocaleString() ?? "",
        a.stage?.name ?? "",
        a.discipline?.name ?? "",
        a.squad?.squadNum?.toString() ?? "",
        a.relay?.toString() ?? "",
        a.shootOrder?.toString() ?? "",
      ]),
    ];
  } else if (type === "staff" && personId) {
    const person = await prisma.person.findUnique({ where: { id: personId } });
    if (!person) return NextResponse.json({ error: "Person not found" }, { status: 404 });
    const assignments = await prisma.staffAssignment.findMany({
      where: { eventId: params.eventId, personId },
      include: { flight: true },
      orderBy: [{ flight: { flightOrder: "asc" } }, { flight: { startTime: "asc" } }],
    });
    rows = [
      ["Name", "Flight", "Start Time", "Role", "Stage", "Relay", "Notes"],
      ...assignments.map((a) => [
        person.fullName,
        a.flight.name,
        a.flight.startTime?.toLocaleString() ?? "",
        a.role ?? "",
        a.stageRef ?? "",
        a.relay?.toString() ?? "",
        a.notes ?? "",
      ]),
    ];
  } else {
    return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
  }

  const content = toCSV(rows, sep);
  const filename = `${event.name.replace(/\s+/g, "_")}_${type}.${ext}`;
  return new NextResponse(content, {
    headers: {
      "Content-Type": format === "tsv" ? "text/tab-separated-values" : "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
