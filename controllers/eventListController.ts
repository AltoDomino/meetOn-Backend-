// controllers/eventListController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getFilteredEvents = async (req: Request, res: Response) => {
  const userId = Number(req.query.userId);

  if (!userId) {
    return res.status(400).json({ error: "Brak userId" });
  }

  try {
    // pobierz zainteresowania użytkownika
    const interests = await prisma.userInterest.findMany({
      where: { userId },
    });

    const interestNames = interests.map((i) => i.activity);

    // pobierz wydarzenia pasujące do zainteresowań (stworzonych przez innych)
    const matchingEvents = await prisma.event.findMany({
      where: {
        activity: { in: interestNames },
        creatorId: { not: userId },
      },
      include: {
        creator: { select: { userName: true } },
      },
    });

    // pobierz wydarzenia stworzone przez użytkownika
    const ownEvents = await prisma.event.findMany({
      where: { creatorId: userId },
      include: {
        creator: { select: { userName: true } },
      },
    });

    // połącz wydarzenia i usuń ewentualne duplikaty (jeśli powstały)
    const allEvents = [...matchingEvents, ...ownEvents];

    // opcjonalne: sortowanie po dacie (najpierw najnowsze)
    allEvents.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    res.json(allEvents);
  } catch (err) {
    console.error("❌ Błąd filtrowania wydarzeń:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
};
