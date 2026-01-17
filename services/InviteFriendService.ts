import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Wyślij zaproszenie do znajomych (PENDING)
 */
export const sendFriendRequest = async (senderId: number, receiverName: string) => {
  const name = receiverName.trim();
  if (name.length < 3) throw new Error("Nazwa użytkownika jest za krótka.");

  const receiver = await prisma.user.findUnique({
    where: { userName: name },
  });

  if (!receiver) throw new Error("Użytkownik nie istnieje");
  if (receiver.id === senderId) throw new Error("Nie możesz wysłać zaproszenia do siebie");

  // ✅ blokada duplikatów (PENDING/ACCEPTED w obie strony)
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: senderId, recipientId: receiver.id }, // ja -> on
        { requesterId: receiver.id, recipientId: senderId }, // on -> ja
      ],
    },
    select: { id: true, status: true, requesterId: true, recipientId: true },
  });

  if (existing) {
    if (existing.status === "ACCEPTED") {
      throw new Error("Jesteście już znajomymi.");
    }

    // status = PENDING
    if (existing.requesterId === senderId) {
      // Ja już wysłałem zaproszenie
      throw new Error("Zaproszenie już zostało wysłane i oczekuje na akceptację.");
    } else {
      // On już wysłał zaproszenie do mnie
      throw new Error("Masz już zaproszenie od tego użytkownika. Zaakceptuj je w 'Zaproszenia oczekujące'.");
      // (Opcja alternatywna: auto-accept — jeśli chcesz, powiem jak)
    }
  }

  // ✅ odporność na race condition: jeśli 2 requesty wejdą naraz, unique zablokuje duplikat
  try {
    return await prisma.friendship.create({
      data: {
        requesterId: senderId,
        recipientId: receiver.id,
        status: "PENDING",
      },
    });
  } catch (e: any) {
    // Prisma unique constraint violation
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new Error("Zaproszenie do tej osoby już istnieje.");
    }
    throw e;
  }
};

/**
 * Akceptuj zaproszenie (PENDING -> ACCEPTED)
 */
export const acceptFriendRequest = async (senderId: number, receiverId: number) => {
  const result = await prisma.friendship.updateMany({
    where: {
      requesterId: senderId,
      recipientId: receiverId,
      status: "PENDING",
    },
    data: {
      status: "ACCEPTED",
    },
  });

  if (result.count === 0) throw new Error("Nie znaleziono takiego zaproszenia.");
  return { ok: true, accepted: result.count };
};

/**
 * Pobierz listę znajomych (ACCEPTED)
 */
export const getFriends = async (userId: number) => {
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { requesterId: userId, status: "ACCEPTED" },
        { recipientId: userId, status: "ACCEPTED" },
      ],
    },
    include: {
      requester: { select: { id: true, userName: true } },
      recipient: { select: { id: true, userName: true } },
    },
  });

  return friendships.map((f) => (f.requesterId === userId ? f.recipient : f.requester));
};

/**
 * Pobierz zaproszenia oczekujące (PENDING) dla użytkownika (recipient)
 */
export const getFriendRequests = async (userId: number) => {
  const requests = await prisma.friendship.findMany({
    where: {
      recipientId: userId,
      status: "PENDING",
    },
    include: {
      requester: {
        select: {
          id: true,
          userName: true,
        },
      },
    },
  });

  return requests.map((r) => ({
    requesterId: r.requester.id,
    userName: r.requester.userName,
  }));
};

/**
 * ✅ USUŃ ZNAJOMEGO (ACCEPTED) – działa w obie strony relacji
 */
export const removeFriend = async (userId: number, friendId: number) => {
  if (!userId || !friendId) throw new Error("Brak danych.");
  if (userId === friendId) throw new Error("Nie możesz usunąć siebie.");

  const result = await prisma.friendship.deleteMany({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: userId, recipientId: friendId },
        { requesterId: friendId, recipientId: userId },
      ],
    },
  });

  if (result.count === 0) throw new Error("Nie znaleziono takiej relacji znajomości.");
  return { ok: true, removed: result.count };
};

/**
 * ✅ ODRZUĆ ZAPROSZENIE (recipient usuwa PENDING)
 */
export const rejectFriendRequest = async (userId: number, requesterId: number) => {
  if (!userId || !requesterId) throw new Error("Brak danych.");

  const result = await prisma.friendship.deleteMany({
    where: {
      status: "PENDING",
      requesterId,
      recipientId: userId,
    },
  });

  if (result.count === 0) throw new Error("Nie znaleziono takiego zaproszenia.");
  return { ok: true, rejected: result.count };
};

/**
 * ✅ ANULUJ ZAPROSZENIE (requester usuwa PENDING)
 */
export const cancelFriendRequest = async (userId: number, recipientId: number) => {
  if (!userId || !recipientId) throw new Error("Brak danych.");

  const result = await prisma.friendship.deleteMany({
    where: {
      status: "PENDING",
      requesterId: userId,
      recipientId,
    },
  });

  if (result.count === 0) throw new Error("Nie znaleziono takiego zaproszenia.");
  return { ok: true, canceled: result.count };
};
