import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) return null;

  if (!user.isVerified) {
    throw new Error("Konto nie zostało zweryfikowane.");
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) return null;

  return { id: user.id, email: user.email, userName: user.userName, isVerified: user.isVerified };
};
