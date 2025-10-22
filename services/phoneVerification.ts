import { PrismaClient } from "@prisma/client";
import twilio from "twilio";

const prisma = new PrismaClient();

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const fromNumber = process.env.TWILIO_PHONE_NUMBER!;

const client = twilio(accountSid, authToken);

export async function sendVerificationCode(phoneNumber: string) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

  await prisma.user.upsert({
    where: { phoneNumber },
    update: { verificationCode: code, codeExpiresAt: expiresAt },
    create: {
      userName: `temp_${Date.now()}`,
      email: `${Date.now()}@temp.meeton.app`,
      password: "TEMP",
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

export async function verifyCode(phoneNumber: string, code: string) {
  const user = await prisma.user.findUnique({ where: { phoneNumber } });
  if (!user) throw new Error("Użytkownik nie istnieje");

  const isValid =
    user.verificationCode === code &&
    user.codeExpiresAt &&
    user.codeExpiresAt > new Date();

  if (!isValid) throw new Error("Nieprawidłowy lub wygasły kod");

  await prisma.user.update({
    where: { phoneNumber },
    data: {
      isPhoneVerified: true,
      verificationCode: null,
      codeExpiresAt: null,
    },
  });

  return { success: true };
}
