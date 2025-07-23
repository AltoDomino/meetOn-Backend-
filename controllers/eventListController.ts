import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import geolib from "geolib";

const prisma = new PrismaClient();

type FormattedEvent = {
  id: number;
  activity: string;
  location: string;
  startDate: Date;
  endDate: Date;
  creator: {
    userName: string;
  };
  spots: number;
  participantsCount: number;
  isUserJoined: boolean;
  isCreator: boolean;
};

export const getFilteredEvents = async (req: Request, res: Response) => {
  const userId = Number(req.query.userId);
  const ownOnly = req.query.ownOnly === "true";
  const maxDistance = req.query.distance ? Number(req.query.distance) : null;
  const userLat = Number(req.query.latitude);
  const userLng = Number(req.query.longitude);

  if (!userId) {
    return res.status(400).json({ error: "Brak userId" });
  }

  if (maxDistance && (!userLat || !userLng)) {
    return res.status(400).json({ error: "Brak współrzędnych użytkownika" });
  }

  try {
    // 🔹 Wydarzenia stworzone przez użytkownika
    if (ownOnly) {
      const ownEvents = await prisma.event.findMany({
        where: { creatorId: userId },
        include: {
          creator: { select: { userName: true } },
        },
      });

      const formatted: FormattedEvent[] = await Promise.all(
        ownEvents.map(async (event) => {
          const participants = await prisma.eventParticipant.findMany({
            where: { eventId: event.id },
          });

          return {
            id: event.id,
            activity: event.activity,
            location: event.location,
            startDate: event.startDate,
            endDate: event.endDate,
            creator: event.creator,
            spots: event.maxParticipants,
            participantsCount: participants.length,
            isUserJoined: true,
            isCreator: true,
          };
        })
      );

      return res.json(formatted);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { age: true },
    });

    if (!user || user.age === null) {
      return res.status(400).json({ error: "Brak informacji o wieku użytkownika." });
    }

    const interests = await prisma.userInterest.findMany({
      where: { userId },
    });

    const interestNames = interests.map((i) => i.activity);

    let matchingEvents = await prisma.event.findMany({
      where: {
        activity: { in: interestNames },
        creatorId: { not: userId },
        minAge: { lte: user.age },
        maxAge: { gte: user.age },
      },
      include: {
        creator: { select: { userName: true } },
      },
    });

    // 🔹 Filtrowanie po dystansie
    if (maxDistance && userLat && userLng) {
      matchingEvents = matchingEvents.filter((event) => {
        if (!event.latitude || !event.longitude) return false;

        const distance = geolib.getDistance(
          { latitude: userLat, longitude: userLng },
          { latitude: event.latitude, longitude: event.longitude }
        );

        const distanceInKm = distance / 1000;
        return distanceInKm <= maxDistance;
      });
    }

    const joinedEventLinks = await prisma.eventParticipant.findMany({
      where: { userId },
    });

    const joinedEventIds = joinedEventLinks.map((ep) => ep.eventId);

    const joinedEvents = await prisma.event.findMany({
      where: {
        id: { in: joinedEventIds },
        creatorId: { not: userId },
      },
      include: {
        creator: { select: { userName: true } },
      },
    });

    const eventMap = new Map<number, FormattedEvent>();

    const processEvent = async (event: any, isJoined: boolean) => {
      const participants = await prisma.eventParticipant.findMany({
        where: { eventId: event.id },
      });

      eventMap.set(event.id, {
        id: event.id,
        activity: event.activity,
        location: event.location,
        startDate: event.startDate,
        endDate: event.endDate,
        creator: event.creator,
        spots: event.maxParticipants,
        participantsCount: participants.length,
        isUserJoined: isJoined,
        isCreator: false,
      });
    };

    await Promise.all(matchingEvents.map((event) => processEvent(event, false)));
    await Promise.all(joinedEvents.map((event) => processEvent(event, true)));

    const formatted = Array.from(eventMap.values()).sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );

    res.json(formatted);
  } catch (err) {
    console.error("❌ Błąd filtrowania wydarzeń:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
};
