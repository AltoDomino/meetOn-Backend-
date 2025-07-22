import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return null; // zamiast throw
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    return null; // zamiast throw
  }

  return { id: user.id, email: user.email, userName: user.userName };
};
