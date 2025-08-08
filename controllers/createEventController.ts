import { Request, Response } from "express";
import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushReceipt } from "expo-server-sdk";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const expo = new Expo();

export const createEventController = async (req: Request, res: Response) => {
  const {
    location, address, startDate, endDate, activity, creatorId,
    spots, genderSplit, minAge, maxAge, latitude, longitude,
  } = req.body;

  try {
    // --- walidacje dat ---
    const parsedStart = new Date(startDate);
    const parsedEnd   = new Date(endDate);
    const now         = new Date();

    if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
      return res.status(400).json({ error: "Nieprawidłowy format daty." });
    }
    if (parsedStart <= now) {
      return res.status(400).json({ error: "Data rozpoczęcia musi być w przyszłości." });
    }
    if (parsedEnd <= parsedStart) {
      return res.status(400).json({ error: "Data zakończenia musi być po rozpoczęciu." });
    }

    // --- utworzenie eventu ---
    const event = await prisma.event.create({
      data: {
        location,
        address,
        startDate: parsedStart,
        endDate: parsedEnd,
        activity,
        creatorId: Number(creatorId),
        maxParticipants: Number(spots),
        genderBalance: !!genderSplit,
        minAge: minAge ?? 0,
        maxAge: maxAge ?? 99,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
      },
    });

    const creator = await prisma.user.findUnique({
      where: { id: Number(creatorId) },
      select: { userName: true, avatarUrl: true },
    });
    const userName = creator?.userName ?? "Użytkownik";
    const avatarUrl = creator?.avatarUrl ?? null;

    const joinedCount = await prisma.eventParticipant.count({
      where: { eventId: event.id },
    });

    // --- odbiorcy wg zainteresowań / wieku ---
    const interestedUsers = await prisma.user.findMany({
      where: {
        userInterests: { some: { activity } },
        ...(event.minAge != null && event.maxAge != null
          ? { age: { gte: event.minAge, lte: event.maxAge } }
          : {}),
        id: { not: Number(creatorId) },
      },
      select: { id: true },
    });
    const userIds = interestedUsers.map(u => u.id);

    // --- tokeny push z bazy ---
    const tokens = await prisma.pushToken.findMany({
      where: { userId: { in: userIds } },
      select: { id: true, userId: true, token: true },
    });

    console.log("🔔 Kandydaci do notyfikacji:", {
      usersMatched: userIds.length,
      tokensFound: tokens.length,
      sample: tokens.slice(0, 5).map(t => ({ userId: t.userId, token: t.token })),
    });

    // --- filtrowanie tylko Expo tokens ---
    const valid = tokens.filter(t => Expo.isExpoPushToken(t.token));
    const invalid = tokens.filter(t => !Expo.isExpoPushToken(t.token));
    if (invalid.length) {
      console.warn("⚠️ Odrzucone (nie-Expo tokens):", invalid.slice(0, 5).map(t => t.token));
    }

    const fullAddress = address || location || "nieokreślona lokalizacja";

    const messages: ExpoPushMessage[] = valid.map(t => ({
      to: t.token,
      sound: "default",
      title: `${userName} zaprasza na ${activity}!`,
      body: `📍 ${fullAddress}\n👥 Uczestnicy: ${joinedCount} / ${spots}`,
      data: {
        eventId: event.id,
        activity,
        location,
        address,
        maxParticipants: spots,
        creatorName: userName,
        creatorAvatar: avatarUrl,
      },
      priority: "high",
    }));

    console.log("📦 Przygotowane wiadomości:", { messagesCount: messages.length });

    // --- wysyłka (tickets) ---
    const chunks = expo.chunkPushNotifications(messages);
    const allTickets: ExpoPushTicket[] = [];
    for (const chunk of chunks) {
      try {
        const tickets = await expo.sendPushNotificationsAsync(chunk);
        allTickets.push(...tickets);
        console.log("📨 Tickets (chunk):", JSON.stringify(tickets, null, 2));
      } catch (err) {
        console.error("❌ Błąd wysyłki chunku:", err);
      }
    }

    // --- receipt IDs do weryfikacji ---
    const ticketIds = allTickets
      .map(t => (t as any).id)
      .filter((id): id is string => typeof id === "string");

    console.log("🧾 Zebrane ticketIds:", ticketIds);

    // mały odstęp (opcjonalny), żeby receipts były gotowe
    await new Promise(r => setTimeout(r, 1500));

    // --- pobranie receipts i analiza błędów ---
    const receiptIdChunks = expo.chunkPushNotificationReceiptIds(ticketIds);
    const tokensToDelete: string[] = [];

    for (const receiptIdChunk of receiptIdChunks) {
      try {
        const receipts = await expo.getPushNotificationReceiptsAsync(receiptIdChunk);
        console.log("📬 Receipts (chunk):", JSON.stringify(receipts, null, 2));

        for (const [id, receipt] of Object.entries<ExpoPushReceipt>(receipts)) {
          if (receipt.status === "ok") continue;

          console.error(`❌ Receipt error for ticket ${id}:`, receipt);

          // typowe błędy: DeviceNotRegistered, MessageTooBig, MessageRateExceeded, InvalidCredentials
          if (receipt.details && (receipt.details as any).error === "DeviceNotRegistered") {
            // nie mamy powiązania ticketId -> token, więc wyczyścimy wszystkie nieaktualne poniżej po walidacji "DeviceNotRegistered" po stronie /send
            // (ew. możesz dorobić mapowanie 'ticketId -> token' przed wysyłką)
          }
        }
      } catch (err) {
        console.error("❌ Błąd pobierania receipts:", err);
      }
    }

    // --- prosta walidacja/cleanup tokenów po statusie 'error' już na etapie tickets ---
    // Jeśli w tickets pojawił się error "DeviceNotRegistered", wyczyść takie tokeny.
    const badTokens = valid
      .map(v => v.token)
      .filter(tok => allTickets.some(t => (t.status === "error") && (t as any).details?.error === "DeviceNotRegistered"));

    if (badTokens.length) {
      console.warn("🧹 Usuwam martwe tokeny (DeviceNotRegistered):", badTokens.length);
      await prisma.pushToken.deleteMany({ where: { token: { in: badTokens } } });
    }

    // --- zapisz notyfikacje in-app (Twoja logika) ---
    await Promise.all(
      userIds.map(userId =>
        prisma.notification.create({
          data: { userId, message: `${userName} stworzył wydarzenie: ${activity}` },
        })
      )
    );

    res.status(201).json(event);
  } catch (err) {
    console.error("❌ Błąd tworzenia wydarzenia:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
};
