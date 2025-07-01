// --- joinEvent.controller.ts ---
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const joinEventController = async (req: Request, res: Response) => {
  const { userId, eventId } = req.body;

  if (!userId || !eventId) {
    return res.status(400).json({ error: "Brak userId lub eventId" });
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        eventParticipants: {
          include: { user: true },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: "Wydarzenie nie istnieje" });
    }

    const isAlreadyJoined = await prisma.eventParticipant.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    if (isAlreadyJoined) {
      return res.status(400).json({ error: "Użytkownik już dołączył" });
    }

    const totalSpots = event.maxParticipants;
    const currentCount = event.eventParticipants.length;

    if (currentCount >= totalSpots) {
      return res.status(400).json({ error: "Brak miejsc w wydarzeniu" });
    }

    if (event.genderBalance) {
      const males = event.eventParticipants.filter(p => p.user.gender === "male").length;
      const females = event.eventParticipants.filter(p => p.user.gender === "female").length;

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.gender) {
        return res.status(400).json({ error: "Brak informacji o płci użytkownika" });
      }

      const half = Math.floor(totalSpots / 2);
      const oddSpot = totalSpots % 2 === 1; // jeśli nieparzysta liczba

      if (user.gender === "male" && males >= half + (oddSpot && males <= females ? 1 : 0)) {
        return res.status(400).json({ error: "Brak miejsc dla mężczyzn" });
      }

      if (user.gender === "female" && females >= half + (oddSpot && females <= males ? 1 : 0)) {
        return res.status(400).json({ error: "Brak miejsc dla kobiet" });
      }
    }

    await prisma.eventParticipant.create({
      data: {
        userId,
        eventId,
      },
    });

    res.status(201).json({ message: "Dołączono do wydarzenia" });
  } catch (error) {
    console.error("❌ Błąd dołączania do wydarzenia:", error);
    res.status(500).json({ error: "Błąd serwera" });
  }
};
