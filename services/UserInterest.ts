import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const saveUserInterests = async (userId: number, activities: string[]) => {
  console.log("Usuwam stare zainteresowania użytkownika ID:", userId);

  await prisma.userInterest.deleteMany({
    where: { userId }
  });

  const data = activities.map((activity) => ({
    userId,
    activity
  }));

  console.log("Zapisuję nowe zainteresowania:", data);

  const result = await prisma.userInterest.createMany({
    data
  });

  console.log("Wynik zapisu:", result);

  return result;
};

export const getUserInterests = async (userId: number) => {
  return await prisma.userInterest.findMany({
    where: { userId }
  });
};
