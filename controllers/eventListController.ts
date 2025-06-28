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
          participants: true,
        },
      });

      const formatted: FormattedEvent[] = ownEvents.map(
        (event: (typeof ownEvents)[number]) => ({
          id: event.id,
          activity: event.activity,
          location: event.location,
          startDate: event.startDate,
          endDate: event.endDate,
          creator: event.creator,
          spots: event.maxParticipants,
          participantsCount: event.participants.length,
        })
      );

      return res.json(formatted);
    }

    const interests = await prisma.userInterest.findMany({
      where: { userId },
    });

    const interestNames = interests.map(
      (i: { activity: string }) => i.activity
    );

    const matchingEvents = await prisma.event.findMany({
      where: {
        activity: { in: interestNames },
        creatorId: { not: userId },
      },
      include: {
        creator: { select: { userName: true } },
        participants: true,
      },
    });

    const formatted: FormattedEvent[] = matchingEvents.map(
      (event: (typeof matchingEvents)[number]) => ({
        id: event.id,
        activity: event.activity,
        location: event.location,
        startDate: event.startDate,
        endDate: event.endDate,
        creator: event.creator,
        spots: event.maxParticipants,
        participantsCount: event.participants.length,
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
