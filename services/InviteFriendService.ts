import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Wyślij zaproszenie do znajomych (PENDING)
 */
export const sendFriendRequest = async (senderId: number, receiverName: string) => {
  const receiver = await prisma.user.findUnique({
    where: { userName: receiverName },
  });

  if (!receiver) throw new Error("Użytkownik nie istnieje");

  if (receiver.id === senderId) {
    throw new Error("Nie możesz wysłać zaproszenia do siebie");
  }

  // ✅ blokada duplikatów (PENDING/ACCEPTED w obie strony)
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: senderId, recipientId: receiver.id },
        { requesterId: receiver.id, recipientId: senderId },
      ],
    },
    select: { id: true, status: true },
  });

  if (existing?.status === "PENDING") throw new Error("Zaproszenie już istnieje.");
  if (existing?.status === "ACCEPTED") throw new Error("Jesteście już znajomymi.");

  return await prisma.friendship.create({
    data: {
      requesterId: senderId,
      recipientId: receiver.id,
      status: "PENDING",
    },
  });
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
 * userId = aktualny użytkownik
 * friendId = znajomy do usunięcia
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
 * userId = recipientId (ten co odrzuca)
 * requesterId = senderId (ten co wysłał)
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
 * ✅ (OPCJONALNIE) ANULUJ ZAPROSZENIE (requester usuwa PENDING)
 * userId = requesterId (ten co anuluję)
 * recipientId = odbiorca
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
