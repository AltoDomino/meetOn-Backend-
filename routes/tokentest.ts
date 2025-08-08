// routes/tokentest.ts
import express from "express";
import { Expo } from "expo-server-sdk";
import { PrismaClient } from "@prisma/client";
// Dostosuj ścieżkę jeśli masz inaczej
import admin from "../services/NotificationServices/lib/firebaseAdmin";

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
    // Pobierz WSZYSTKIE tokeny usera
    const tokens = await prisma.pushToken.findMany({
      where: { userId: Number(userId) },
      select: { token: true, tokenType: true, platform: true },
    });

    if (!tokens.length) {
      return res.status(400).json({ error: "Użytkownik nie ma zapisanych tokenów" });
    }

    // Rozdziel: Expo vs FCM (po tokenType lub prefiksie)
    const expoTokens: string[] = [];
    const fcmTokens: string[] = [];

    for (const t of tokens) {
      const tok = (t.token || "").trim();
      if (!tok) continue;

      if (t.tokenType === "expo" || tok.startsWith("ExponentPushToken[")) {
        expoTokens.push(tok);
      } else {
        fcmTokens.push(tok);
      }
    }

    const title = "Test powiadomienia";
    const body = message || "To jest testowe powiadomienie";

    const result: any = { expo: { sent: 0 }, fcm: { sent: 0 } };

    // 1) FCM (Android / iOS natywnie)
    if (fcmTokens.length && admin?.messaging) {
      try {
        const fcmMsg = {
          tokens: fcmTokens,
          notification: { title, body },
          android: { priority: "high" as const, notification: { sound: "default" } },
          apns: { payload: { aps: { sound: "default", contentAvailable: true } } },
          data: { test: "true" },
        };

        const fcmRes = await admin.messaging().sendEachForMulticast(fcmMsg);
        result.fcm.sent = fcmRes.successCount;

        // Wywal nieaktywne tokeny
        await Promise.all(
          fcmRes.responses.map(async (r, i) => {
            if (!r.success) {
              const code = r.error?.code || "";
              console.error("FCM error:", fcmTokens[i], code, r.error?.message);
              if (code === "messaging/registration-token-not-registered") {
                await prisma.pushToken.deleteMany({ where: { token: fcmTokens[i] } }).catch(() => {});
              }
            }
          })
        );
      } catch (e) {
        console.error("❌ FCM send error:", e);
        result.fcm.error = String(e);
      }
    }

    // 2) Expo fallback
    if (expoTokens.length) {
      const messages = expoTokens.map((to) => ({
        to,
        title,
        body,
        sound: "default" as const,
        priority: "high" as const,
        data: { test: "true" },
      }));

      const chunks = expo.chunkPushNotifications(messages);
      let sent = 0;

      for (const chunk of chunks) {
        try {
          const tickets = await expo.sendPushNotificationsAsync(chunk);
          // sprawdź receipt’y
          const receiptIds = tickets
            .filter((t) => t.status === "ok" && "id" in t)
            .map((t: any) => t.id);

          sent += tickets.filter((t) => t.status === "ok").length;

          if (receiptIds.length) {
            const receipts = await expo.getPushNotificationReceiptsAsync(receiptIds);
            for (const [id, r] of Object.entries<any>(receipts)) {
              if (r.status === "error") {
                console.error("Expo receipt error:", id, r.message, r.details);
                // jeśli r.details?.error === "DeviceNotRegistered", można tu usunąć token,
                // ale nie mamy mapy receipt->token; zostawiamy jak jest.
              }
            }
          }
        } catch (e) {
          console.error("❌ Expo send error:", e);
          result.expo.error = String(e);
        }
      }

      result.expo.sent = sent;
    }

    return res.status(200).json({ ok: true, result, counts: { expo: expoTokens.length, fcm: fcmTokens.length } });
  } catch (err) {
    console.error("Błąd push:", err);
    return res.status(500).json({ error: "Błąd wysyłki" });
  }
});

export default router;
