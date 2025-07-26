import { PrismaClient } from "@prisma/client";
import { getDistance } from "geolib";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const getFilteredEvents = async (req: Request, res: Response) => {
  const userId = Number(req.query.userId);
  const ownOnly = req.query.ownOnly === "true";
  const maxDistance = req.query.distance ? Number(req.query.distance) : null;
  const minDistance = req.query.minDistance ? Number(req.query.minDistance) : 0;
  const userLat = Number(req.query.latitude);
  const userLng = Number(req.query.longitude);

  if (!userId) {
    return res.status(400).json({ error: "Brak userId" });
  }

  try {
    console.log("🔍 Parametry zapytania:", {
      userId,
      ownOnly,
      minDistance,
      maxDistance,
      userLat,
      userLng,
    });

    if (ownOnly) {
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

      const merged = [...joined.map((e) => e.event), ...created];
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

      console.log("📦 Zwracane wydarzenia (ownOnly):", Array.from(map.values()));
      return res.json(Array.from(map.values()));
    }

    const baseWhere = maxDistance && userLat && userLng
      ? { creatorId: { not: userId } }
      : {};

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

    console.log(
      "👤 Twórcy wydarzeń:",
      events.map((e) => `${e.id} - ${e.creator.userName}`)
    );

    let filteredEvents = events;

    if (maxDistance && userLat && userLng) {
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

    const mapped = filteredEvents.map((event) => ({
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
