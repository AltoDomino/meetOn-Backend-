import express from "express";
import { PrismaClient, Platform, PushTokenType } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/", async (req, res) => {
  try {
    const { userId, token, platform } = req.body as {
      userId?: number;
      token?: string;
      platform?: string;
    };

    if (!userId || !token) {
      return res.status(400).json({ error: "Brakuje danych (userId, token)" });
    }

    const tokenType: PushTokenType = token.startsWith("ExponentPushToken[")
      ? PushTokenType.expo
      : PushTokenType.fcm;

    const normalizedPlatform: Platform | undefined =
      platform && ["android", "ios", "web"].includes(platform)
        ? (platform as Platform)
        : undefined;

    const saved = await prisma.pushToken.upsert({
      where: { userId_token: { userId, token } },
      update: { tokenType, platform: normalizedPlatform },
      create: { userId, token, tokenType, platform: normalizedPlatform },
    });

    return res.status(200).json({ message: "Token zapisany", saved });
  } catch (error) {
    console.error("Błąd zapisu tokena:", error);
    return res.status(500).json({ error: "Błąd serwera" });
  }
});

export default router;
