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

  // Sprawdź czy wydarzenie istnieje
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) throw new Error("Nie znaleziono wydarzenia.");

  // Sprawdź ile osób już dołączyło
  const participantCount = await prisma.eventParticipant.count({
    where: { eventId },
  });

  if (participantCount >= event.maxParticipants) {
    throw new Error("Brak wolnych miejsc.");
  }

  // Dodaj użytkownika do wydarzenia
  await prisma.eventParticipant.create({
    data: { userId, eventId },
  });

  return { message: "Dołączono do wydarzenia." };
};
