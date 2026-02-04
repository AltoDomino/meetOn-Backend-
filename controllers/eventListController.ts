import { PrismaClient } from "@prisma/client";
import { getDistance } from "geolib";
import { Request, Response } from "express";

const prisma = new PrismaClient();

/** Spójny klucz lokacji (korzysta z pól z Event dodanych w schemacie) */
function normalizeLocationKey(event: {
  locationId?: string | null;
  locationKey?: string | null;
  location?: string | null;
}) {
  if (event.locationId) return `pid:${event.locationId}`;
  if (event.locationKey) return event.locationKey!;
  if (event.location) {
    const norm = event.location.toLowerCase().trim().replace(/\s+/g, "-");
    return `name:${norm}`;
  }
  return "unknown";
}

/**
 * Nalicza „ukończone wydarzenie” dla użytkownika
 * dla wszystkich eventów, które się już zakończyły i nie były jeszcze zaliczone.
 * Zwraca liczbę nowych zaliczeń.
 */
async function awardJustFinishedEventsForUser(userId: number): Promise<number> {
  const now = new Date();

  // Wszystkie eventy, w których user brał udział i które już się skończyły
  const rows = await prisma.eventParticipant.findMany({
    where: {
      userId,
      event: { endDate: { lte: now } },
    },
    select: {
      event: {
        select: {
          id: true,
          endDate: true,
          locationId: true,
          locationKey: true,
          location: true,
        },
      },
    },
  });

  if (!rows.length) return 0;

  const eventIds = rows.map((r) => r.event.id);

  // Które z nich są już zaliczone?
  const already = await prisma.eventCompletion.findMany({
    where: { userId, eventId: { in: eventIds } },
    select: { eventId: true },
  });
  const completedSet = new Set(already.map((r) => r.eventId));

  const toAward = rows.filter((r) => !completedSet.has(r.event.id));
  if (!toAward.length) return 0;

  let awardedCount = 0;

  for (const { event } of toAward) {
    const locKey = normalizeLocationKey(event);
    try {
      await prisma.$transaction(async (tx) => {
        // 1) wpis ukończenia (idempotencja: unique [userId,eventId])
        await tx.eventCompletion.create({
          data: { userId, eventId: event.id, locationKey: locKey },
        });

        // 2) unikalna wizyta lokacji
        await tx.userLocationVisit.upsert({
          where: { userId_locationKey: { userId, locationKey: locKey } },
          create: { userId, locationKey: locKey },
          update: {},
        });

        // 3) przelicz liczbę unikalnych lokacji
        const uniqueLocations = await tx.userLocationVisit.count({
          where: { userId },
        });

        // 4) zaktualizuj liczniki użytkownika
        await tx.user.update({
          where: { id: userId },
          data: {
            rankCompletedEvents: { increment: 1 },
            rankUniqueLocations: uniqueLocations,
          },
        });
      });

      awardedCount++;
    } catch (e: any) {
      // Jeżeli już istnieje EventCompletion (P2002), ignorujemy.
      if (e?.code === "P2002") continue;
      console.warn(
        `[rank] awarding failed for user=${userId} event=${event.id}:`,
        e?.message ?? e
      );
    }
  }

  return awardedCount;
}

export const getFilteredEvents = async (req: Request, res: Response) => {
  const userId = Number(req.query.userId);

  const ownOnly = req.query.ownOnly === "true";
  const joinedOnly = req.query.joinedOnly === "true";

  const maxDistance = req.query.distance ? Number(req.query.distance) : null;
  const minDistance = req.query.minDistance ? Number(req.query.minDistance) : 0;
  const userLat = req.query.latitude ? Number(req.query.latitude) : NaN;
  const userLng = req.query.longitude ? Number(req.query.longitude) : NaN;

  if (!userId) {
    return res.status(400).json({ error: "Brak userId" });
  }

  try {
    console.log("🔍 Parametry zapytania:", {
      userId,
      ownOnly,
      joinedOnly,
      minDistance,
      maxDistance,
      userLat,
      userLng,
    });

    // ⬇️ NAJPIERW nalicz ukończone eventy (rank) dla tego usera
    const newAwards = await awardJustFinishedEventsForUser(userId);
    if (newAwards > 0) {
      console.log(
        `🏅 Użytkownik ${userId}: naliczono ${newAwards} ukończonych wydarzeń`
      );
    }

    /**
     * ✅ 1) MOJE WYDARZENIA = tylko stworzone (creatorId === userId)
     *    GET /api/events?userId=...&ownOnly=true
     */
    if (ownOnly) {
      const now = new Date();

      const created = await prisma.event.findMany({
        where: {
          creatorId: userId,
          endDate: { gt: now }, // auto-ukrywanie zakończonych
        },
        include: {
          creator: { select: { id: true, userName: true } },
          eventParticipants: true,
        },
      });

      const mapped = created.map((ev) => ({
        id: ev.id,
        activity: ev.activity,
        location: ev.location,
        startDate: ev.startDate,
        endDate: ev.endDate,
        creator: ev.creator,
        spots: ev.maxParticipants,
        participantsCount: ev.eventParticipants.length,
        isUserJoined: true,
        isCreator: true,
      }));

      console.log("📦 Zwracane wydarzenia (ownOnly=created):", mapped);
      return res.json(mapped);
    }

    /**
     * ✅ 2) DOŁĄCZONE WYDARZENIA = tylko takie, gdzie user jest uczestnikiem
     *    i NIE jest twórcą
     *    GET /api/events?userId=...&joinedOnly=true
     */
    if (joinedOnly) {
      const now = new Date();

      const joined = await prisma.eventParticipant.findMany({
        where: {
          userId,
          event: { endDate: { gt: now } },
        },
        include: {
          event: {
            include: {
              creator: { select: { id: true, userName: true } },
              eventParticipants: true,
            },
          },
        },
      });

      const mapped = joined
        .map((r) => r.event)
        .filter((ev) => ev.creatorId !== userId) // tylko cudze
        .map((ev) => ({
          id: ev.id,
          activity: ev.activity,
          location: ev.location,
          startDate: ev.startDate,
          endDate: ev.endDate,
          creator: ev.creator,
          spots: ev.maxParticipants,
          participantsCount: ev.eventParticipants.length,
          isUserJoined: true,
          isCreator: false,
        }));

      console.log("📦 Zwracane wydarzenia (joinedOnly):", mapped);
      return res.json(mapped);
    }

    /**
     * ✅ 3) STANDARDOWA LISTA EVENTÓW (Events screen) z dystansami
     */

    const hasCoords = Number.isFinite(userLat) && Number.isFinite(userLng);
    const baseWhere =
      maxDistance && hasCoords ? { creatorId: { not: userId } } : {};

    const events = await prisma.event.findMany({
      where: baseWhere,
      select: {
        id: true,
        activity: true,
        location: true,
        startDate: true,
        endDate: true,
        latitude: true,
        longitude: true,
        creatorId: true,
        maxParticipants: true,
        creator: { select: { id: true, userName: true } },
        eventParticipants: true,
      },
    });

    console.log(
      "📍 Wszystkie eventy z lokalizacją:",
      events.map((e) => ({
        id: e.id,
        location: e.location,
        latitude: e.latitude,
        longitude: e.longitude,
      }))
    );

    let filteredEvents = events;

    if (maxDistance && hasCoords) {
      filteredEvents = events.filter((event) => {
        if (!event.latitude || !event.longitude) {
          console.log(`⚠️ Event ${event.id} nie ma współrzędnych`);
          return false;
        }

        const distance = getDistance(
          { latitude: userLat, longitude: userLng },
          { latitude: event.latitude, longitude: event.longitude }
        );

        const distanceKm = distance / 1000;
        console.log(`📏 Dystans do eventu ${event.id}: ${distanceKm} km`);

        return distanceKm <= maxDistance && distanceKm >= minDistance;
      });
    }

    const now = new Date();
    const upcomingEvents = filteredEvents.filter(
      (event) => new Date(event.endDate) > now
    );

    const mapped = upcomingEvents.map((event) => ({
      id: event.id,
      activity: event.activity,
      location: event.location,
      startDate: event.startDate,
      endDate: event.endDate,
      creator: event.creator,
      spots: event.maxParticipants,
      participantsCount: event.eventParticipants.length,
      isUserJoined: event.eventParticipants.some((p) => p.userId === userId),
      isCreator: event.creatorId === userId,
    }));

    console.log("📦 Wynik filtrowania:", mapped);
    return res.json(mapped);
  } catch (err: any) {
    console.error("❌ Błąd filtrowania wydarzeń:", err);
    return res.status(500).json({ error: "Błąd serwera", details: err.message });
  }
};
