// services/NotificationServices/getNotifications.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getNotificationsForUser = async (userId: number) => {
  return await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};
