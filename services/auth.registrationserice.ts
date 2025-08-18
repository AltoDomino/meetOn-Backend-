// services/auth.registrationservice.ts
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { sendVerificationEmail } from "./auth.email.service";
import { HttpError } from "../utils/http-error";

const prisma = new PrismaClient();

type RegisterInput = {
  userName: string;
  email: string;
  password: string;
  gender?: string | null;
  age?: number | null;
};

export const registerUser = async ({
  userName,
  email,
  password,
  gender,
  age,
}: RegisterInput) => {
  // bezpieczeństwo: normalizacja e-maila (gdyby kontroler kiedyś nie zrobił)
  const normalizedEmail = (email ?? "").trim().toLowerCase();

  // wstępne sprawdzenie (UX) – ale i tak łapiemy P2002 niżej
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    throw new HttpError(409, "Użytkownik z tym adresem e-mail już istnieje.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const verificationToken = nanoid(32);
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  try {
    const user = await prisma.user.create({
      data: {
        userName,
        email: normalizedEmail,
        password: hashedPassword,
        gender: gender ?? null,
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
  } catch (err: any) {
    // twarda ochrona przed duplikatem (np. wyścig)
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new Error("Użytkownik z tym adresem e-mail już istnieje.");
    }
    throw err; // inne błędy obsłuży globalny handler (500 -> { message: "Błąd serwera" })
  }
};
