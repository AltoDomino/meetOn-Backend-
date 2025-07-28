import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getEventDetailsController = async (
  req: Request,
  res: Response
) => {
  const eventId = Number(req.params.id);

  if (!eventId) {
    return res.status(400).json({ error: "Brak eventId w adresie URL" });
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        creator: {
          select: { userName: true },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: "Wydarzenie nie istnieje" });
    }

    const eventParticipants = await prisma.eventParticipant.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            avatarUrl: true,
            description: true,
            age: true, // 👉 Dodajemy wiek
          },
        },
      },
    });

    const participants = eventParticipants.map((ep) => ({
      id: ep.user.id,
      userName: ep.user.userName,
      avatar: ep.user.avatarUrl,
      description: ep.user.description,
      age: ep.user.age, // 👉 Dodajemy wiek do odpowiedzi
    }));

    const formattedEvent = {
      id: event.id,
      activity: event.activity,
      location: event.location,
      startDate: event.startDate,
      endDate: event.endDate,
      creator: event.creator,
      participantsCount: participants.length,
      maxParticipants: event.maxParticipants,
      participants,
    };

    res.status(200).json(formattedEvent);
  } catch (err) {
    console.error("❌ Błąd pobierania szczegółów wydarzenia:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
};
