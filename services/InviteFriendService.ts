import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const sendFriendRequest = async (senderId: number, receiverName: string) => {
  const receiver = await prisma.user.findUnique({
    where: { userName: receiverName },
  });

  if (!receiver) throw new Error("Użytkownik nie istnieje");

  if (receiver.id === senderId)
    throw new Error("Nie możesz wysłać zaproszenia do siebie");

  return await prisma.friendship.create({
    data: {
      requesterId: senderId,
      recipientId: receiver.id,
      status: "PENDING",
    },
  });
};

export const acceptFriendRequest = async (senderId: number, receiverId: number) => {
  return await prisma.friendship.updateMany({
    where: {
      requesterId: senderId,
      recipientId: receiverId,
      status: "PENDING",
    },
    data: {
      status: "ACCEPTED",
    },
  });
};

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

  return friendships.map((f: { requesterId: number; recipient: any; requester: any; }) =>
    f.requesterId === userId ? f.recipient : f.requester
  );
};

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

  return requests.map((r: { requester: { id: any; userName: any; }; }) => ({
    requesterId: r.requester.id,
    userName: r.requester.userName,
  }));
};