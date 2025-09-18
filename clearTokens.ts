import { PrismaClient } from "@prisma/client";
import admin from "./services/NotificationServices/lib/firebaseAdmin";
import { Expo } from "expo-server-sdk";

const prisma = new PrismaClient();
const expo = new Expo();

async function cleanupTokens() {
  console.log("🧹 Start czyszczenia push tokenów...");

  // Pobierz wszystkie tokeny z DB
  const tokens = await prisma.pushToken.findMany();
  console.log(`📦 Znaleziono ${tokens.length} tokenów w bazie`);

  // Podziel na Expo i FCM
  const expoTokens = tokens.filter(t => t.tokenType === "expo").map(t => t.token);
  const fcmTokens = tokens.filter(t => t.tokenType === "fcm").map(t => t.token);

  // ✅ Walidacja Expo tokenów
  const invalidExpo = expoTokens.filter(t => !Expo.isExpoPushToken(t));
  if (invalidExpo.length > 0) {
    console.log(`❌ Usuwam ${invalidExpo.length} nieprawidłowych Expo tokenów`);
    await prisma.pushToken.deleteMany({ where: { token: { in: invalidExpo }, tokenType: "expo" } });
  }

  // ✅ Walidacja FCM tokenów
  if (fcmTokens.length > 0) {
    const checkMsg = {
      tokens: fcmTokens,
      notification: { title: "TokenCheck", body: "Sprawdzanie ważności tokenu" },
    };

    try {
      const res = await admin.messaging().sendEachForMulticast(checkMsg);
      const invalidFcm: string[] = [];
      res.responses.forEach((r, i) => {
        if (!r.success && r.error?.code === "messaging/registration-token-not-registered") {
          invalidFcm.push(fcmTokens[i]);
        }
      });

      if (invalidFcm.length > 0) {
        console.log(`❌ Usuwam ${invalidFcm.length} nieważnych FCM tokenów`);
        await prisma.pushToken.deleteMany({ where: { token: { in: invalidFcm }, tokenType: "fcm" } });
      }
    } catch (err) {
      console.error("⚠️ Błąd walidacji FCM:", err);
    }
  }

  console.log("✅ Czyszczenie zakończone.");
  await prisma.$disconnect();
}

cleanupTokens();
