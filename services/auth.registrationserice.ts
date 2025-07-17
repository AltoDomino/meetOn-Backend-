import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs"; // ✅ POPRAWNY IMPORT dla bcryptjs
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

export const register = async (
  userName: string,
  email: string,
  password: string,
  gender: string,
  age: number
) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw new Error("Użytkownik z tym adresem e-mail już istnieje.");
  }

  const hashedPassword = await bcrypt.hash(password, 10); // ✅ bcryptjs działa tak samo jak bcrypt

  const verificationToken = uuidv4();
  const verificationExpires = new Date(Date.now() + 1000 * 60 * 60); // 1h

  const newUser = await prisma.user.create({
    data: {
      userName,
      email,
      password: hashedPassword,
      gender,
      age,
      isVerified: false,
      verificationToken,
      verificationExpires,
    },
  });

  return {
    id: newUser.id,
    email: newUser.email,
    userName: newUser.userName,
    verificationToken,
  };
};
