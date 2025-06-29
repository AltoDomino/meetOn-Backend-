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
};

export const getFilteredEvents = async (req: Request, res: Response) => {
  const userId = Number(req.query.userId);
  const ownOnly = req.query.ownOnly === "true";

  if (!userId) {
    return res.status(400).json({ error: "Brak userId" });
  }

  try {
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
            isUserJoined: true, // właściciel wydarzenia = zawsze dołączony
          };
        })
      );

      return res.json(formatted);
    }

    const interests = await prisma.userInterest.findMany({
      where: { userId },
    });

    const interestNames = interests.map((i) => i.activity);

    const matchingEvents = await prisma.event.findMany({
      where: {
        activity: { in: interestNames },
        creatorId: { not: userId },
      },
      include: {
        creator: { select: { userName: true } },
      },
    });

    const formatted: FormattedEvent[] = await Promise.all(
      matchingEvents.map(async (event) => {
        const participants = await prisma.eventParticipant.findMany({
          where: { eventId: event.id },
        });

        const isJoined = await prisma.eventParticipant.findFirst({
          where: { userId, eventId: event.id },
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
          isUserJoined: Boolean(isJoined),
        };
      })
    );

    formatted.sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );

    res.json(formatted);
  } catch (err) {
    console.error("❌ Błąd filtrowania wydarzeń:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
};
