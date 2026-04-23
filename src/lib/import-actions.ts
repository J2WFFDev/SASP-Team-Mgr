import { prisma } from "./prisma";
import { parseTSV, parseDateTime } from "./tsv-parser";
import { PersonRole } from "@prisma/client";

// ---- SQUADDING TSV ----
export async function importSquadding(eventId: string, raw: string) {
  const { rows } = parseTSV(raw);

  type AssignmentData = {
    eventId: string;
    flightId: string;
    stageId: string | null;
    personId: string;
    disciplineId: string | null;
    squadId: string;
    relay: number | null;
    relayCode: string | null;
    shootOrder: number | null;
  };

  const assignments: AssignmentData[] = [];

  for (const row of rows) {
    const squadNumStr = row["Squad"] || row["Squad #"] || row["SquadNum"] || "";
    const squadNum = parseInt(squadNumStr, 10);
    if (isNaN(squadNum)) continue;

    const squadName = row["Squad Name"] || row["SquadName"] || "";
    const division = row["Division"] || row["Div"] || "";
    const personName = row["Athlete"] || row["Name"] || row["Person"] || "";
    const disciplineName = row["Discipline"] || row["Gun"] || row["GunType"] || "";
    const relay = parseInt(row["Relay"] || "0", 10) || null;
    const relayCode = row["RelayCode"] || row["Relay Code"] || "";
    const shootOrder = parseInt(row["Order"] || row["Shoot Order"] || "0", 10) || null;
    const flightName = row["Flight"] || row["Flight Name"] || "";
    const stageName = row["Stage"] || row["Stage Name"] || "";

    if (!personName) continue;

    // Upsert squad
    const squad = await prisma.squad.upsert({
      where: { eventId_squadNum: { eventId, squadNum } },
      update: { squadName: squadName || undefined, division: division || undefined },
      create: { eventId, squadNum, squadName: squadName || null, division: division || null },
    });

    // Upsert person
    const person = await prisma.person.upsert({
      where: { fullName: personName },
      update: {},
      create: { fullName: personName, role: PersonRole.ATHLETE, division: division || null },
    });

    // Upsert discipline
    let discipline = null;
    if (disciplineName) {
      discipline = await prisma.discipline.upsert({
        where: { name: disciplineName },
        update: {},
        create: { name: disciplineName },
      });
    }

    // Upsert flight
    let flight = null;
    if (flightName) {
      const existing = await prisma.flight.findUnique({ where: { eventId_name: { eventId, name: flightName } } });
      if (existing) {
        flight = existing;
      } else {
        flight = await prisma.flight.create({ data: { eventId, name: flightName } });
      }
    }

    // Upsert stage
    let stage = null;
    if (stageName) {
      const existingStage = await prisma.stage.findUnique({ where: { eventId_name: { eventId, name: stageName } } });
      if (existingStage) {
        stage = existingStage;
      } else {
        stage = await prisma.stage.create({ data: { eventId, name: stageName } });
      }
    }

    if (flight) {
      assignments.push({
        eventId,
        flightId: flight.id,
        stageId: stage?.id ?? null,
        personId: person.id,
        disciplineId: discipline?.id ?? null,
        squadId: squad.id,
        relay,
        relayCode: relayCode || null,
        shootOrder,
      });
    }
  }

  // Batch insert all assignments
  if (assignments.length > 0) {
    await prisma.athleteAssignment.createMany({ data: assignments });
  }

  return { ok: true };
}

// ---- SCHEDULE TSV ----
export async function importSchedule(eventId: string, raw: string) {
  const { rows } = parseTSV(raw);

  type AssignmentData = {
    eventId: string;
    flightId: string;
    stageId: string | null;
    personId: string;
    disciplineId: string | null;
    squadId: string | null;
    relay: number | null;
    relayCode: string | null;
    shootOrder: number | null;
  };

  const assignments: AssignmentData[] = [];

  for (const row of rows) {
    const flightName = row["Flight"] || row["Flight Name"] || "";
    const flightTimeStr = row["Time"] || row["Start Time"] || row["Date/Time"] || "";
    const stageName = row["Stage"] || row["Stage Name"] || "";
    const personName = row["Athlete"] || row["Name"] || row["Person"] || "";
    const disciplineName = row["Discipline"] || row["Gun"] || row["Division"] || "";
    const squadNumStr = row["Squad"] || row["Squad #"] || row["SquadNum"] || "";
    const relay = parseInt(row["Relay"] || "0", 10) || null;
    const relayCode = row["RelayCode"] || row["Relay Code"] || row["RC"] || "";
    const shootOrder = parseInt(row["Order"] || row["Shoot Order"] || row["#"] || "0", 10) || null;

    if (!personName || !flightName) continue;

    const flightTime = parseDateTime(flightTimeStr);

    // Upsert flight
    const flight = await prisma.flight.upsert({
      where: { eventId_name: { eventId, name: flightName } },
      update: { startTime: flightTime ?? undefined },
      create: { eventId, name: flightName, startTime: flightTime },
    });

    // Upsert stage
    let stage = null;
    if (stageName) {
      stage = await prisma.stage.upsert({
        where: { eventId_name: { eventId, name: stageName } },
        update: {},
        create: { eventId, name: stageName },
      });
    }

    // Upsert person
    const person = await prisma.person.upsert({
      where: { fullName: personName },
      update: {},
      create: { fullName: personName, role: PersonRole.ATHLETE },
    });

    // Upsert discipline
    let discipline = null;
    if (disciplineName) {
      discipline = await prisma.discipline.upsert({
        where: { name: disciplineName },
        update: {},
        create: { name: disciplineName },
      });
    }

    // Upsert squad
    let squad = null;
    const squadNum = parseInt(squadNumStr, 10);
    if (!isNaN(squadNum)) {
      squad = await prisma.squad.upsert({
        where: { eventId_squadNum: { eventId, squadNum } },
        update: {},
        create: { eventId, squadNum },
      });
    }

    assignments.push({
      eventId,
      flightId: flight.id,
      stageId: stage?.id ?? null,
      personId: person.id,
      disciplineId: discipline?.id ?? null,
      squadId: squad?.id ?? null,
      relay,
      relayCode: relayCode || null,
      shootOrder,
    });
  }

  // Batch insert all assignments
  if (assignments.length > 0) {
    await prisma.athleteAssignment.createMany({ data: assignments });
  }

  return { ok: true };
}

// ---- ATHLETE SCHEDULE INDY TSV ----
export async function importAthScheduleIndy(eventId: string, raw: string) {
  // Same as schedule but keyed by athlete name
  return importSchedule(eventId, raw);
}

// ---- VOL SCHEDULE INDY TSV ----
export async function importVolScheduleIndy(eventId: string, raw: string) {
  const { rows } = parseTSV(raw);

  type StaffData = {
    eventId: string;
    flightId: string;
    personId: string;
    role: string | null;
    stageRef: string | null;
    relay: number | null;
  };

  const staffAssignments: StaffData[] = [];

  for (const row of rows) {
    const flightName = row["Flight"] || row["Flight Name"] || "";
    const flightTimeStr = row["Time"] || row["Start Time"] || row["Date/Time"] || "";
    const personName = row["Volunteer"] || row["Coach"] || row["Name"] || row["Person"] || "";
    const role = row["Role"] || row["Position"] || "";
    const stageRef = row["Stage"] || row["Stage Name"] || "";
    const relay = parseInt(row["Relay"] || "0", 10) || null;

    if (!personName || !flightName) continue;

    const flightTime = parseDateTime(flightTimeStr);

    const flight = await prisma.flight.upsert({
      where: { eventId_name: { eventId, name: flightName } },
      update: { startTime: flightTime ?? undefined },
      create: { eventId, name: flightName, startTime: flightTime },
    });

    const roleLower = role.toLowerCase().trim();
    const personRole: PersonRole =
      /\bcoach\b/.test(roleLower) ? PersonRole.COACH :
      /\bro\b/.test(roleLower) ? PersonRole.RO :
      PersonRole.VOLUNTEER;

    const person = await prisma.person.upsert({
      where: { fullName: personName },
      update: {},
      create: { fullName: personName, role: personRole },
    });

    staffAssignments.push({
      eventId,
      flightId: flight.id,
      personId: person.id,
      role: role || null,
      stageRef: stageRef || null,
      relay,
    });
  }

  // Batch insert all staff assignments
  if (staffAssignments.length > 0) {
    await prisma.staffAssignment.createMany({ data: staffAssignments });
  }

  return { ok: true };
}

// ---- REF TSV ----
export async function importRef(eventId: string, raw: string) {
  const { rows } = parseTSV(raw);

  for (const row of rows) {
    const disciplineName = row["Discipline"] || row["Gun Type"] || row["GunType"] || "";
    const gunType = row["Gun Type"] || row["Gun"] || "";
    if (disciplineName) {
      await prisma.discipline.upsert({
        where: { name: disciplineName },
        update: { gunType: gunType || undefined },
        create: { name: disciplineName, gunType: gunType || null },
      });
    }
  }

  return { ok: true };
}

// ---- CLEAR event data ----
export async function clearEventData(eventId: string) {
  await prisma.athleteAssignment.deleteMany({ where: { eventId } });
  await prisma.staffAssignment.deleteMany({ where: { eventId } });
  await prisma.commitmentStatus.deleteMany({ where: { eventId } });
  await prisma.squad.deleteMany({ where: { eventId } });
  await prisma.stage.deleteMany({ where: { eventId } });
  await prisma.flight.deleteMany({ where: { eventId } });
  return { ok: true };
}
