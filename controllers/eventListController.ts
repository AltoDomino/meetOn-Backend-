import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

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

  if (!userId) {
    return res.status(400).json({ error: "Brak userId" });
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
        ownEvents.map(async (event: { id: any; activity: any; location: any; startDate: any; endDate: any; creator: any; maxParticipants: any; }) => {
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

    // 🔹 Pobierz wiek użytkownika
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { age: true },
    });

    if (!user || user.age === null) {
      return res.status(400).json({ error: "Brak informacji o wieku użytkownika." });
    }

    // 🔹 Pobierz zainteresowania użytkownika
    const interests = await prisma.userInterest.findMany({
      where: { userId },
    });

    const interestNames = interests.map((i: { activity: any; }) => i.activity);

    // 🔹 Pobierz wydarzenia zgodne z zainteresowaniami i wiekiem
    const matchingEvents = await prisma.event.findMany({
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

    // 🔹 Pobierz wydarzenia, do których user dołączył
    const joinedEventLinks = await prisma.eventParticipant.findMany({
      where: { userId },
    });

    const joinedEventIds = joinedEventLinks.map((ep: { eventId: any; }) => ep.eventId);

    const joinedEvents = await prisma.event.findMany({
      where: {
        id: { in: joinedEventIds },
        creatorId: { not: userId },
      },
      include: {
        creator: { select: { userName: true } },
      },
    });

    // 🔹 Połącz wydarzenia: zainteresowania + dołączone (bez duplikatów)
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

    await Promise.all(
      matchingEvents.map((event: any) => processEvent(event, false))
    );

    await Promise.all(
      joinedEvents.map((event: any) => processEvent(event, true))
    );

    const formatted = Array.from(eventMap.values()).sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );

    res.json(formatted);
  } catch (err) {
    console.error("❌ Błąd filtrowania wydarzeń:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
};
