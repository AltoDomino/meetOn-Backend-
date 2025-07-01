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

  // Pobierz wydarzenie wraz z uczestnikami i twórcą
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      creator: true,
      eventParticipants: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!event) {
    throw new Error("Nie znaleziono wydarzenia.");
  }

  // Sprawdź, czy nie przekroczono liczby uczestników
  const currentCount = event.eventParticipants.length;
  if (currentCount >= event.maxParticipants) {
    throw new Error("Brak wolnych miejsc.");
  }

  // Pobierz użytkownika dołączającego
  const joiningUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { gender: true },
  });

  if (!joiningUser || !joiningUser.gender) {
    throw new Error("Brak informacji o płci użytkownika.");
  }

if (event.genderBalance) {
  const participants = event.eventParticipants;

  const males = participants.filter(p => p.user?.gender === "male").length;
  const females = participants.filter(p => p.user?.gender === "female").length;
  const total = participants.length;
  const max = event.maxParticipants;
  const half = Math.floor(max / 2);

  console.log("👨 Mężczyzn:", males);
  console.log("👩 Kobiet:", females);
  console.log("👥 Razem:", total, "/", max);
  console.log("🧍 Płeć dołączającego:", joiningUser.gender);

  if (total >= max) {
    throw new Error("Brak wolnych miejsc.");
  }

  // Główna reguła dla równowagi płci
  if (joiningUser.gender === "male" && males >= half && total < max - 1) {
    throw new Error("Limit mężczyzn w tym wydarzeniu został osiągnięty.");
  }

  if (joiningUser.gender === "female" && females >= half && total < max - 1) {
    throw new Error("Limit kobiet w tym wydarzeniu został osiągnięty.");
  }

  // Jeśli zostało tylko jedno miejsce – wpuszczamy każdego
}

  // Dołącz użytkownika do wydarzenia
  await prisma.eventParticipant.create({
    data: { userId, eventId },
  });

  return { message: "Dołączono do wydarzenia." };
};
