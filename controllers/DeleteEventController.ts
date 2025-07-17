import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const deleteEventController = async (req: Request, res: Response) => {
  const eventId = Number(req.params.eventId);
  const userId = Number(req.body.userId);

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({ error: "Wydarzenie nie istnieje" });
    }

    if (event.creatorId !== userId) {
      return res.status(403).json({ error: "Tylko twórca może usunąć wydarzenie" });
    }

    // Pobierz uczestników wydarzenia
    const participants = await prisma.eventParticipant.findMany({
      where: { eventId },
    });

    if (participants.length > 1) {
      return res
        .status(400)
        .json({ error: "Nie można usunąć wydarzenia z innymi uczestnikami" });
    }

    // Usuń uczestnictwa (na wypadek, gdyby było potrzebne)
    await prisma.eventParticipant.deleteMany({
      where: { eventId },
    });

    // Usuń wydarzenie
    await prisma.event.delete({
      where: { id: eventId },
    });

    res.status(200).json({ message: "Wydarzenie usunięte" });
  } catch (err) {
    console.error("❌ Błąd usuwania eventu:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
};
