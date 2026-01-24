import crypto from "crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { sendResetEmail } from "./mail.service";

const prisma = new PrismaClient();

type ForgotPasswordInput = { email: string };
type ResetPasswordInput = { token: string; newPassword: string };

const RESET_TOKEN_TTL_MIN = 30;

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export const forgotPasswordService = async ({ email }: ForgotPasswordInput) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  // ✅ nie zdradzamy czy user istnieje
  if (!user) return;

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MIN * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetTokenHash: tokenHash,
      resetTokenExpiresAt: expiresAt,
    },
  });

  // 🔗 deep link do aplikacji
  const deepLink = `meeton://reset-password?token=${token}`;

  await sendResetEmail(user.email, deepLink);
};

export const resetPasswordService = async ({
  token,
  newPassword,
}: ResetPasswordInput) => {
  const tokenHash = sha256(token);

  const user = await prisma.user.findFirst({
    where: {
      resetTokenHash: tokenHash,
      resetTokenExpiresAt: { gt: new Date() },
    },
    select: { id: true },
  });

  if (!user) {
    throw new Error("Token jest nieprawidłowy lub wygasł.");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    },
  });
};
