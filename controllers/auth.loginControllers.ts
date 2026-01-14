import { NextFunction, Request, Response } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import { login } from "../services/auth.loginService";
import appleSignin from "apple-signin-auth";
import { OAuth2Client } from "google-auth-library";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const googleClient = new OAuth2Client();

const GOOGLE_AUDIENCES = [
  process.env.GOOGLE_CLIENT_ID, // web
  process.env.GOOGLE_IOS_CLIENT_ID,
  process.env.GOOGLE_ANDROID_CLIENT_ID,
].filter(Boolean) as string[];

function generateJwt(user: any) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is missing");

  const secret = process.env.JWT_SECRET;
  const DEFAULT_EXPIRES_IN = "7d" as const;

  const payload = {
    id: user.id,
    email: user.email,
    userName: user.userName,
    isAdmin: (user as any).isAdmin ?? false,
  };

  const expiresIn: SignOptions["expiresIn"] =
    (process.env.JWT_EXPIRES as SignOptions["expiresIn"]) ?? DEFAULT_EXPIRES_IN;

  return jwt.sign(payload, secret, { expiresIn });
}

// 📌 Zwykłe logowanie e-mail + hasło
export const getLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await login(email, password);

    if (!user) return res.status(401).json({ message: "Niepoprawny email lub hasło" });
    if (!user.isVerified)
      return res.status(403).json({ message: "Zweryfikuj e-mail przed zalogowaniem." });

    const token = generateJwt(user);

    // ✅ TS-safe dostęp (nawet jeśli login() zwraca typ bez gender)
    const gender = (user as any).gender ?? null;

    return res.status(200).json({
      userId: user.id,
      userName: user.userName,
      email: user.email,
      gender, // ✅ DODANE

      isPhoneVerified: user.isPhoneVerified,
      isRegistrationComplete: user.isRegistrationComplete,
      token,
    });
  } catch (err) {
    next(err);
  }
};

// 📌 Logowanie przez Google
export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { id_token } = req.body;
    if (!id_token) return res.status(400).json({ message: "Brak tokenu Google" });

    if (GOOGLE_AUDIENCES.length === 0) {
      return res.status(500).json({
        message:
          "Brak konfiguracji GOOGLE_*_CLIENT_ID (GOOGLE_CLIENT_ID / GOOGLE_IOS_CLIENT_ID / GOOGLE_ANDROID_CLIENT_ID).",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: id_token,
      audience: GOOGLE_AUDIENCES,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) return res.status(400).json({ message: "Brak emaila w tokenie Google" });

    let user = await prisma.user.findUnique({ where: { email: payload.email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: payload.email,
          userName: payload.name || payload.email.split("@")[0],
          password: "",
          isVerified: true,
          isPhoneVerified: false,
          isRegistrationComplete: false,
          // gender: null -> uzupełni w CompleteRegistration
        },
      });
    }

    const token = generateJwt(user);

    return res.json({
      userId: user.id,
      userName: user.userName,
      email: user.email,
      gender: user.gender ?? null, // ✅ DODANE

      isPhoneVerified: user.isPhoneVerified,
      isRegistrationComplete: user.isRegistrationComplete,
      token,
    });
  } catch (err: any) {
    console.error("Google login error:", err);
    return res.status(400).json({
      message: "Google token invalid",
      details: typeof err?.message === "string" ? err.message : String(err),
    });
  }
};

// 📌 Logowanie przez Apple
export const appleLogin = async (req: Request, res: Response) => {
  try {
    const { id_token } = req.body;
    if (!id_token) return res.status(400).json({ message: "Brak tokenu Apple" });

    const appleData = await appleSignin.verifyIdToken(id_token, {
      audience: process.env.APPLE_CLIENT_ID,
      ignoreExpiration: true,
    });

    const email = appleData.email || "";
    if (!email) return res.status(400).json({ message: "Brak emaila w tokenie Apple" });

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          userName: email.split("@")[0],
          password: "",
          isVerified: true,
          isPhoneVerified: false,
          isRegistrationComplete: false,
        },
      });
    }

    const token = generateJwt(user);

    return res.json({
      userId: user.id,
      userName: user.userName,
      email: user.email,
      gender: user.gender ?? null, // ✅ DODANE

      isPhoneVerified: user.isPhoneVerified,
      isRegistrationComplete: user.isRegistrationComplete,
      token,
    });
  } catch (err: any) {
    console.error("Apple login error:", err);
    return res.status(400).json({
      message: "Apple token invalid",
      details: typeof err?.message === "string" ? err.message : String(err),
    });
  }
};
