// routes/tokentest.ts
import express from "express";
import { Expo } from "expo-server-sdk";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const expo = new Expo();
const prisma = new PrismaClient();

router.post("/", async (req, res) => {
  const { userId, message } = req.body;
  console.log("Req body:", req.body);

  if (!userId) {
    return res.status(400).json({ error: "Brak userId w zapytaniu" });
  }

  try {
    const tokenRecord = await prisma.pushToken.findUnique({
      where: { userId: Number(userId) },
    });

    if (!tokenRecord || !Expo.isExpoPushToken(tokenRecord.token)) {
      return res.status(400).json({ error: "Brak prawidłowego tokena push" });
    }

    const notification = {
      to: tokenRecord.token,
      sound: "default",
      title: "Test powiadomienia",
      body: message || "To jest testowe powiadomienie",
    };

    const chunks = expo.chunkPushNotifications([notification]);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Błąd push:", err);
    res.status(500).json({ error: "Błąd wysyłki" });
  }
});

export default router;
