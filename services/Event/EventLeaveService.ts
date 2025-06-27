import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const leaveEvent = async (userId: number, eventId: number) => {
  const participation = await prisma.eventParticipant.findUnique({
    where: {
      userId_eventId: {
        userId,
        eventId,
      },
    },
  });

  if (!participation) {
    throw new Error("Użytkownik nie jest zapisany na to wydarzenie.");
  }

  await prisma.eventParticipant.delete({
    where: {
      userId_eventId: {
        userId,
        eventId,
      },
    },
  });

  return { message: "Użytkownik opuścił wydarzenie." };
};
