import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const findUsersInterestedInActivity = async (activity: string, excludeUserId: number) => {
  return await prisma.userInterest.findMany({
    where: {
      activity,
      userId: {
        not: excludeUserId  
      }
    },
    include: {
      user: true
    }
  });
};
