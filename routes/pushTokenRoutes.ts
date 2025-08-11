import express from "express";
import { PrismaClient, Platform, PushTokenType } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/", async (req, res) => {
  try {
    const { userId, token, fcmToken, platform } = req.body as {
      userId?: number;
      token?: string;      // Expo
      fcmToken?: string;   // FCM
      platform?: string;   // "android" | "ios" | "web"
    };

    // 🔍 Log wysyłanych danych
    console.log("📦 Wysyłam do backendu:", {
      userId,
      token,
      fcmToken,
      platform,
    });

    if (!userId || (!token && !fcmToken)) {
      return res.status(400).json({ error: "Wymagane: userId oraz token lub fcmToken" });
    }

    const normPlatform: Platform | undefined =
      platform && ["android", "ios", "web"].includes(platform)
        ? (platform as Platform)
        : undefined;

    const saved: any[] = [];

    // Zapis Expo tokenu
    if (token) {
      const s = await prisma.pushToken.upsert({
        where: { userId_token: { userId, token } },
        update: { tokenType: PushTokenType.expo, platform: normPlatform },
        create: { userId, token, tokenType: PushTokenType.expo, platform: normPlatform },
      });
      saved.push({ kind: "expo", value: token });
      console.log("📨 Expo token zapisany:", token);
    }

    // Zapis FCM tokenu
    if (fcmToken) {
      const s = await prisma.pushToken.upsert({
        where: { userId_token: { userId, token: fcmToken } },
        update: { tokenType: PushTokenType.fcm, platform: normPlatform },
        create: { userId, token: fcmToken, tokenType: PushTokenType.fcm, platform: normPlatform },
      });
      saved.push({ kind: "fcm", value: fcmToken });
      console.log("🔥 FCM token zapisany:", fcmToken);
    }

    return res.status(200).json({ ok: true, saved });
  } catch (err) {
    console.error("Błąd zapisu tokena:", err);
    return res.status(500).json({ error: "Błąd serwera" });
  }
});

export default router;
