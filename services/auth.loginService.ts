import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const login = async (email: string, password: string) => {
  // 🔹 Znajdź użytkownika po e-mailu
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) return null;

  // 🔹 Sprawdź, czy konto zostało zweryfikowane
  if (!user.isVerified) {
    throw new Error("Konto nie zostało zweryfikowane.");
  }

  // 🔹 Upewnij się, że użytkownik ma hasło (nie loguje się np. przez Google)
  if (!user.password) {
    throw new Error("To konto jest połączone z logowaniem przez Google lub Apple.");
  }

  // 🔹 Porównaj hasło
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return null;

  // ✅ Zwróć wszystkie potrzebne pola, spójne z logiką logowania Google/Apple
  return {
    id: user.id,
    email: user.email,
    userName: user.userName,
    isVerified: user.isVerified,
    isPhoneVerified: user.isPhoneVerified,
    isRegistrationComplete: user.isRegistrationComplete, // 🔥 dodane
    avatarUrl: user.avatarUrl,
    description: user.description,
  };
};
