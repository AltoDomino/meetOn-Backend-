import crypto from "crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { sendResetEmail } from "./mail.service";

const prisma = new PrismaClient();

type ForgotPasswordInput = { email: string };
type ResetPasswordInput = { token: string; newPassword: string };

const RESET_TOKEN_TTL_MIN = 30;

const now = () => new Date().toISOString();

const maskEmail = (email: string) => {
  const [user, domain] = String(email || "").split("@");
  if (!domain) return "***";
  const u = user.length <= 2 ? `${user[0] ?? ""}*` : `${user.slice(0, 2)}***`;
  return `${u}@${domain}`;
};

const maskToken = (t: string, keep = 8) => {
  if (!t) return "";
  if (t.length <= keep) return `${t}…`;
  return `${t.slice(0, keep)}…(${t.length})`;
};

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export const forgotPasswordService = async ({ email }: ForgotPasswordInput) => {
  const start = Date.now();

  console.log("\n================ FORGOT SERVICE / START ================");
  console.log({
    time: now(),
    email: maskEmail(email),
    hasResendKey: !!process.env.RESEND_API_KEY,
    mailFrom: process.env.MAIL_FROM ?? null,
    frontendUrl: process.env.FRONTEND_URL ?? null,
    ttlMin: RESET_TOKEN_TTL_MIN,
  });

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    console.log("FORGOT SERVICE / USER LOOKUP", {
      time: now(),
      found: !!user,
      userId: user?.id ?? null,
    });

    // ✅ nie zdradzamy czy user istnieje
    if (!user) {
      console.log("FORGOT SERVICE / END (NO USER)", {
        time: now(),
        ms: Date.now() - start,
      });
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = sha256(token);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MIN * 60 * 1000);

    console.log("FORGOT SERVICE / TOKEN GENERATED", {
      time: now(),
      tokenMasked: maskToken(token),
      tokenHashMasked: maskToken(tokenHash, 10),
      expiresAt: expiresAt.toISOString(),
    });

    const upd = await prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash: tokenHash,
        resetTokenExpiresAt: expiresAt,
      },
      select: { id: true, resetTokenExpiresAt: true },
    });

    console.log("FORGOT SERVICE / USER UPDATED", {
      time: now(),
      userId: upd.id,
      resetTokenExpiresAt: upd.resetTokenExpiresAt?.toISOString() ?? null,
    });

    // ✅ KLIKALNY LINK (Vercel / www) zamiast meeton://
    const backendBase = (
      process.env.BACKEND_PUBLIC_URL ||
      "https://meeton-backend-ffmo.onrender.com"
    ).replace(/\/+$/, "");

    const webResetUrl = `${backendBase}/api/login/reset-password?token=${encodeURIComponent(token)}`;

    console.log("FORGOT SERVICE / SENDING EMAIL", {
      time: now(),
      to: maskEmail(user.email),
      linkPreview: webResetUrl.slice(0, 80) + "…",
    });

    const sendResult = await sendResetEmail(user.email, webResetUrl);

    console.log("FORGOT SERVICE / EMAIL SENT RESULT", {
      time: now(),
      sendResult: sendResult ?? null,
    });

    console.log("FORGOT SERVICE / END OK", {
      time: now(),
      ms: Date.now() - start,
    });
  } catch (e: any) {
    console.error("❌ FORGOT SERVICE / ERROR", {
      time: now(),
      message: e?.message ?? String(e),
      name: e?.name,
      stack: e?.stack,
    });
    console.log("FORGOT SERVICE / END ERROR", {
      time: now(),
      ms: Date.now() - start,
    });
    throw e;
  }
};

export const resetPasswordService = async ({
  token,
  newPassword,
}: ResetPasswordInput) => {
  const start = Date.now();

  console.log("\n================ RESET SERVICE / START ================");
  console.log({
    time: now(),
    tokenMasked: maskToken(token),
    newPasswordLen: newPassword?.length ?? 0, // nie logujemy hasła
  });

  try {
    const tokenHash = sha256(token);

    console.log("RESET SERVICE / TOKEN HASHED", {
      time: now(),
      tokenHashMasked: maskToken(tokenHash, 10),
    });

    const user = await prisma.user.findFirst({
      where: {
        resetTokenHash: tokenHash,
        resetTokenExpiresAt: { gt: new Date() },
      },
      select: { id: true, resetTokenExpiresAt: true },
    });

    console.log("RESET SERVICE / USER MATCH", {
      time: now(),
      found: !!user,
      userId: user?.id ?? null,
      expiresAt: user?.resetTokenExpiresAt?.toISOString() ?? null,
    });

    if (!user) {
      console.log("RESET SERVICE / END (INVALID TOKEN)", {
        time: now(),
        ms: Date.now() - start,
      });
      throw new Error("Token jest nieprawidłowy lub wygasł.");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    console.log("RESET SERVICE / PASSWORD HASHED", {
      time: now(),
      hashLen: hashedPassword.length,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
      },
      select: { id: true },
    });

    console.log("RESET SERVICE / UPDATED OK", {
      time: now(),
      userId: user.id,
    });

    console.log("RESET SERVICE / END OK", {
      time: now(),
      ms: Date.now() - start,
    });
  } catch (e: any) {
    console.error("❌ RESET SERVICE / ERROR", {
      time: now(),
      message: e?.message ?? String(e),
      name: e?.name,
      stack: e?.stack,
    });
    console.log("RESET SERVICE / END ERROR", {
      time: now(),
      ms: Date.now() - start,
    });
    throw e;
  }
};
