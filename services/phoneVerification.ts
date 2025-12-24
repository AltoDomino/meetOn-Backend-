import { PrismaClient } from "@prisma/client";
import twilio from "twilio";

const prisma = new PrismaClient();

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const fromNumber = process.env.TWILIO_PHONE_NUMBER!;

const client = twilio(accountSid, authToken);

export async function sendVerificationCode(userId: number, phoneNumber: string) {
  if (!userId) throw new Error("userId is required");
  if (!phoneNumber) throw new Error("phoneNumber is required");

  // czy numer nie jest już zajęty przez kogoś innego?
  const existing = await prisma.user.findUnique({ where: { phoneNumber } });
  if (existing && existing.id !== userId) {
    throw new Error("Ten numer telefonu jest już przypisany do innego konta");
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

  await prisma.user.update({
    where: { id: userId },
    data: {
      phoneNumber,
      verificationCode: code,
      codeExpiresAt: expiresAt,
    },
  });

  await client.messages.create({
    body: `Twój kod weryfikacyjny meetOn: ${code}`,
    from: fromNumber,
    to: phoneNumber,
  });

  return { success: true };
}

export async function verifyCode(userId: number, phoneNumber: string, code: string) {
  if (!userId) throw new Error("userId is required");
  if (!phoneNumber) throw new Error("phoneNumber is required");
  if (!code) throw new Error("code is required");

  const user = await prisma.user.findFirst({
    where: { id: userId, phoneNumber },
  });

  if (!user) throw new Error("Użytkownik nie istnieje lub numer nie pasuje");

  const isValid =
    user.verificationCode === code &&
    user.codeExpiresAt &&
    user.codeExpiresAt > new Date();

  if (!isValid) throw new Error("Nieprawidłowy lub wygasły kod");

  await prisma.user.update({
    where: { id: userId },
    data: {
      isPhoneVerified: true,
      verificationCode: null,
      codeExpiresAt: null,
    },
  });

  return { success: true };
}
