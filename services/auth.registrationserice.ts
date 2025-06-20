import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const register = async (userName: string, email: string, password: string) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw new Error("Użytkownik z tym adresem e-mail już istnieje.");
  }

  const newUser = await prisma.user.create({
    data: {
      userName,
      email,
      password,
    },
  });

  return { id: newUser.id, email: newUser.email, userName: newUser.userName };
};
