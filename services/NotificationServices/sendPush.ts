import { PrismaClient } from "@prisma/client";
import admin from "./lib/firebaseAdmin";
import { Expo } from "expo-server-sdk";

const prisma = new PrismaClient();
const expo = new Expo();

/**
 * Wysyła push do listy userId — najpierw FCM, a dla tokenów Expo fallback na Expo.
 * Możesz wołać z kontrolera tworzenia eventu.
 */
export async function sendPushToUsers(
  userIds: number[],
  payload: {
    title: string;
    body: string;
    data?: Record<string, any>;
    sound?: "default" | null;
  }
) {
  // 1) Pobierz tokeny z DB
  // Zakładam, że masz tabelę `pushToken` z polem `token`.
  // Jeśli dodałeś osobne pole `fcmToken`, to rozszerz select.
  const tokens = await prisma.pushToken.findMany({
    where: { userId: { in: userIds } },
    select: { token: true }, // <- jeżeli masz też fcmToken: select { token: true, fcmToken: true }
  });

  // 2) Rozdziel tokeny – prosta heurystyka:
  //    Expo zaczyna się od "ExponentPushToken[", FCM – wszystko inne (na Androidzie najczęściej długi string).
  const expoTokens: string[] = [];
  const fcmTokens: string[] = [];

  for (const t of tokens) {
    const tok = t.token?.trim();
    if (!tok) continue;
    if (tok.startsWith("ExponentPushToken[")) expoTokens.push(tok);
    else fcmTokens.push(tok);
  }

  // 3) FCM
  if (fcmTokens.length) {
    const fcmMessage = {
      tokens: fcmTokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: Object.fromEntries(
        Object.entries(payload.data ?? {}).map(([k, v]) => [k, String(v)])
      ),
      android: {
        priority: "high" as const,
        notification: { sound: payload.sound ?? "default" },
      },
      apns: {
        payload: {
          aps: {
            sound: payload.sound ?? "default",
            contentAvailable: true,
          },
        },
      },
    };

    try {
      const res = await admin.messaging().sendEachForMulticast(fcmMessage);
      // podgląd błędów (np. DeviceNotRegistered)
      res.responses.forEach((r, i) => {
        if (!r.success) {
          console.error("❌ FCM error:", fcmTokens[i], r.error?.code, r.error?.message);
          // Opcjonalnie: usuń nieaktywne tokeny:
          if (r.error?.code === "messaging/registration-token-not-registered") {
            prisma.pushToken.deleteMany({ where: { token: fcmTokens[i] } }).catch(() => {});
          }
        }
      });
      console.log(`✅ FCM sent: ${res.successCount}/${fcmTokens.length}`);
    } catch (err) {
      console.error("❌ FCM send error:", err);
    }
  }

  // 4) Expo fallback (gdy masz w bazie stare Expo tokeny)
  if (expoTokens.length) {
    const messages = expoTokens.map((to) => ({
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
        // Zbierz receiptId i sprawdź błędy
        const receiptIds = tickets
          .filter((t) => t.status === "ok" && "id" in t)
          .map((t: any) => t.id);

        if (receiptIds.length) {
          const receipts = await expo.getPushNotificationReceiptsAsync(receiptIds);
          for (const [id, r] of Object.entries<any>(receipts)) {
            if (r.status === "error") {
              console.error("❌ Expo receipt error:", id, r.message, r.details);
              if (r.details?.error === "DeviceNotRegistered") {
                // usuń nieaktualny token expo
                // (nie mamy mapy token -> receipt, więc zostawiamy jak jest
                // lub wcześniej trzymaj mapę chunk-tokenów)
              }
            }
          }
        }
      } catch (err) {
        console.error("❌ Expo send error:", err);
      }
    }
  }
}
