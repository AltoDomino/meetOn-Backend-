import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new Error("Nie znaleziono użytkownika o podanym adresie e-mail.");
  }

  if (user.password !== password) {
    throw new Error("Nieprawidłowe hasło.");
  }

  return { id: user.id, email: user.email, userName: user.userName };
};
