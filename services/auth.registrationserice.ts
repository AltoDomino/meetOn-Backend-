// services/auth.registrationserice.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { sendVerificationEmail } from "./auth.email.service";

const prisma = new PrismaClient();

type RegisterInput = {
  userName: string;
  email: string;
  password: string;
  gender?: string | null;
  age?: number | null;
};

export const registerUser = async ({ userName, email, password, gender, age }: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("Użytkownik z tym adresem e-mail już istnieje.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const verificationToken = nanoid(32);
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  const user = await prisma.user.create({
    data: {
      userName,
      email,
      password: hashedPassword,
      gender: gender || null,
      age: age ?? null,
      avatarUrl: null,
      description: null,
      verificationToken,
      verificationExpires,
      isVerified: false,
    },
  });

  await sendVerificationEmail(user.email, verificationToken);

  return { message: "Użytkownik został zarejestrowany. Sprawdź e-mail w celu weryfikacji." };
};
