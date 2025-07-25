import { PrismaClient } from "@prisma/client";
import { getDistance } from "geolib";

const prisma = new PrismaClient();

export const getFilteredEvents = async (req, res) => {
  const userId = Number(req.query.userId);
  const ownOnly = req.query.ownOnly === "true";
  const maxDistance = req.query.distance ? Number(req.query.distance) : null;
  const userLat = Number(req.query.latitude);
  const userLng = Number(req.query.longitude);

  if (!userId) {
    return res.status(400).json({ error: "Brak userId" });
  }

  try {
    console.log("🔍 Parametry zapytania:", {
      userId,
      ownOnly,
      maxDistance,
      userLat,
      userLng,
    });

    let events;

    if (ownOnly) {
      // Pokaż tylko wydarzenia utworzone lub dołączone przez użytkownika
      const now = new Date();

      const joined = await prisma.eventParticipant.findMany({
        where: {
          userId,
          event: { endDate: { gt: now } },
        },
        include: {
          event: {
            include: {
              creator: { select: { userName: true } },
              eventParticipants: {
                include: { user: { select: { gender: true } } },
              },
            },
          },
        },
      });

      const created = await prisma.event.findMany({
        where: {
          creatorId: userId,
          endDate: { gt: now },
        },
        include: {
          creator: { select: { userName: true } },
          eventParticipants: {
            include: { user: { select: { gender: true } } },
          },
        },
      });

      const merged = [
        ...joined.map((e) => e.event),
        ...created,
      ];

      // Usuwamy duplikaty po ID
      const map = new Map();
      for (const ev of merged) {
        map.set(ev.id, {
          id: ev.id,
          activity: ev.activity,
          location: ev.location,
          startDate: ev.startDate,
          endDate: ev.endDate,
          creator: ev.creator,
          spots: ev.maxParticipants,
          participantsCount: ev.eventParticipants.length,
          isUserJoined: ev.eventParticipants.some((p) => p.userId === userId),
          isCreator: ev.creatorId === userId,
        });
      }

      return res.json(Array.from(map.values()));
    }

    events = await prisma.event.findMany({
      where: {
        creatorId: { not: userId },
      },
      include: {
        creator: {
          select: {
            id: true,
            userName: true,
          },
        },
        eventParticipants: true,
      },
    });

    if (maxDistance && userLat && userLng) {
      const filtered = events.filter((event) => {
        if (!event.latitude || !event.longitude) return false;

        const distance = getDistance(
          { latitude: userLat, longitude: userLng },
          { latitude: event.latitude, longitude: event.longitude }
        );

        return distance / 1000 <= maxDistance;
      });

      const mapped = filtered.map((event) => ({
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

      return res.json(mapped);
    } else {
      const mapped = events.map((event) => ({
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

      return res.json(mapped);
    }
  } catch (err) {
    console.error("❌ Błąd filtrowania wydarzeń:", err);
    res.status(500).json({ error: "Błąd serwera", details: err.message });
  }
};
