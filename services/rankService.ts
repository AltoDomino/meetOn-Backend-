import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function normalizeLocationKey(event: { locationId?: string | null; locationKey?: string | null; location?: string | null }) {
  if (event.locationId) return `pid:${event.locationId}`;
  if (event.locationKey) return event.locationKey;
  if (event.location) {
    const norm = event.location.toLowerCase().trim().replace(/\s+/g, "-");
    return `name:${norm}`;
  }
  return "unknown";
}

export async function getUserRankStats(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { rankCompletedEvents: true, rankUniqueLocations: true },
  });
  return {
    completedEvents: user?.rankCompletedEvents ?? 0,
    uniqueLocations: user?.rankUniqueLocations ?? 0,
  };
}

export async function completeEventForUser(params: { userId: number; eventId: number }) {
  const { userId, eventId } = params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, endDate: true, locationId: true, locationKey: true, location: true },
  });
  if (!event) throw new Error("EVENT_NOT_FOUND");
  if (new Date(event.endDate).getTime() > Date.now()) throw new Error("EVENT_NOT_FINISHED");

  // Czy user uczestniczył?
  const participation = await prisma.eventParticipant.findUnique({
    where: { eventId_userId: { eventId, userId } },
    select: { eventId: true, userId: true },
  });
  // Możesz też dopuścić twórcę eventu, jeśli masz pole creatorId
  if (!participation /* && event.creatorId !== userId */) {
    throw new Error("NOT_A_PARTICIPANT");
  }

  const locKey = normalizeLocationKey(event);

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1) próbujemy wstawić zaliczenie (idempotencja przez unique)
      const completion = await tx.eventCompletion.create({
        data: { userId, eventId, locationKey: locKey },
      });

      // 2) próbujemy wstawić wizytę lokalizacji (unikalny klucz)
      await tx.userLocationVisit.upsert({
        where: { userId_locationKey: { userId, locationKey: locKey } },
        create: { userId, locationKey: locKey },
        update: {},
      });

      // 3) przeliczenie agregatów (lub inkrementacje)
      // Możesz inkrementować rankCompletedEvents += 1 i policzyć unikalne lokalizacje count(*) z UserLocationVisit.
      const uniqueLocations = await tx.userLocationVisit.count({
        where: { userId },
      });

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          rankCompletedEvents: { increment: 1 },
          rankUniqueLocations: uniqueLocations,
        },
        select: { rankCompletedEvents: true, rankUniqueLocations: true },
      });

      return updatedUser;
    });

    return {
      completedEvents: result.rankCompletedEvents,
      uniqueLocations: result.rankUniqueLocations,
      awarded: true,
    };
  } catch (e: any) {
    // P2002 = unique constraint violation -> zaliczenie już istniało (idempotencja)
    if (e?.code === "P2002") {
      const stats = await getUserRankStats(userId);
      return { ...stats, awarded: false };
    }
    throw e;
  }
}
