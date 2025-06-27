import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const joinEvent = async (userId: number, eventId: number) => {
  // Sprawdź, czy user już dołączył
  const alreadyJoined = await prisma.eventParticipant.findUnique({
    where: {
      userId_eventId: {
        userId,
        eventId,
      },
    },
  });

  if (alreadyJoined) {
    throw new Error("Użytkownik już dołączył do wydarzenia.");
  }

  // Sprawdź ilu jest uczestników i ile miejsc
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { participants: true },
  });

  if (!event) throw new Error("Nie znaleziono wydarzenia.");

  if (event.participants.length >= event.maxParticipants) {
    throw new Error("Brak wolnych miejsc.");
  }

  // Dodaj użytkownika do wydarzenia
  await prisma.eventParticipant.create({
    data: { userId, eventId },
  });

  return { message: "Dołączono do wydarzenia." };
};
