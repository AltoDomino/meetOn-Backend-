import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const deleteUserAccount = async (userId: number) => {
  // 1. Usuń uczestnictwa w eventach
  await prisma.eventParticipant.deleteMany({ where: { userId } });

  // 2. Usuń zaliczone wydarzenia (rankingi)
  await prisma.eventCompletion.deleteMany({ where: { userId } });

  // 3. Usuń odwiedzone lokalizacje
  await prisma.userLocationVisit.deleteMany({ where: { userId } });

  // 4. Usuń zainteresowania
  await prisma.userInterest.deleteMany({ where: { userId } });

  // 5. Usuń tokeny push
  await prisma.pushToken.deleteMany({ where: { userId } });

  // 6. Usuń powiadomienia
  await prisma.notification.deleteMany({ where: { userId } });

  // 7. Usuń znajomości (jako requester lub recipient)
  await prisma.friendship.deleteMany({
    where: { OR: [{ requesterId: userId }, { recipientId: userId }] },
  });

  // 8. Usuń wydarzenia, które użytkownik utworzył
  await prisma.event.deleteMany({ where: { creatorId: userId } });

  // 9. Usuń samego użytkownika
  await prisma.user.delete({ where: { id: userId } });

  return true;
};
