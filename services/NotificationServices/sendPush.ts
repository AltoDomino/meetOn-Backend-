import { PrismaClient } from "@prisma/client";
import admin from "./lib/firebaseAdmin";
import { Expo } from "expo-server-sdk";

const prisma = new PrismaClient();
const expo = new Expo();

export async function sendPushToUsers(
  userIds: number[],
  payload: { title: string; body: string; data?: Record<string, any>; sound?: "default" | null }
) {
  const tokens = await prisma.pushToken.findMany({
    where: { userId: { in: userIds } },
    select: { token: true, tokenType: true },
  });

  const expoTokens = tokens.filter(t => t.tokenType === "expo").map(t => t.token);
  const fcmTokens = tokens.filter(t => t.tokenType === "fcm").map(t => t.token);

  // --- FCM ---
  if (fcmTokens.length > 0) {
    const fcmMessage = {
      tokens: fcmTokens,
      notification: { title: payload.title, body: payload.body },
      data: Object.fromEntries(Object.entries(payload.data ?? {}).map(([k, v]) => [k, String(v)])),
      android: { priority: "high" as const, notification: { sound: payload.sound ?? "default" } },
      apns: { payload: { aps: { sound: payload.sound ?? "default", contentAvailable: true } } },
    };

    try {
      const res = await admin.messaging().sendEachForMulticast(fcmMessage);
      res.responses.forEach((r, i) => {
        if (!r.success) {
          console.error("❌ FCM error:", fcmTokens[i], r.error?.code);
          if (r.error?.code === "messaging/registration-token-not-registered") {
            prisma.pushToken.deleteMany({ where: { token: fcmTokens[i], tokenType: "fcm" } }).catch(() => {});
          }
        }
      });
      console.log(`✅ FCM sent: ${res.successCount}/${fcmTokens.length}`);
    } catch (err) {
      console.error("❌ FCM send error:", err);
    }
  }

  // --- Expo ---
  if (expoTokens.length > 0) {
    const messages = expoTokens.map(to => ({
      to,
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
      sound: payload.sound ?? "default",
      priority: "high" as const,
    }));

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        const tickets = await expo.sendPushNotificationsAsync(chunk);
        console.log("📨 Expo tickets:", tickets);
      } catch (err) {
        console.error("❌ Expo send error:", err);
      }
    }
  }
}
