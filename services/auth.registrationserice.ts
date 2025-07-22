import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { sendVerificationEmail } from "./auth.verification.service";

const prisma = new PrismaClient();

export const registerUser = async ({ userName, email, password, gender, dateOfBirth, age }) => {
  // Sprawdź czy użytkownik już istnieje
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("Użytkownik z tym adresem e-mail już istnieje.");
  }

  // Haszowanie hasła
  const hashedPassword = await bcrypt.hash(password, 10);

  // Generowanie tokenu weryfikacyjnego
  const verificationToken = nanoid(32);
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); 

  // Zapis do bazy
  const user = await prisma.user.create({
    data: {
      userName,
      email,
      password: hashedPassword,
      gender,
      dateOfBirth,
      age,
      verificationToken,
      verificationExpires,
      isVerified: false,
    },
  });

  // Wysyłka maila weryfikacyjnego
  await sendVerificationEmail(user.email, verificationToken);

  return { message: "Użytkownik został zarejestrowany. Sprawdź e-mail w celu weryfikacji." };
};
