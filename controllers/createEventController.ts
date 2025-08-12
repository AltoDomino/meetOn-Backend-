import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { sendPushToUsers } from "../services/NotificationServices/sendPush";

const prisma = new PrismaClient();

export const createEventController = async (req: Request, res: Response) => {
  const {
    location,
    address,
    startDate,
    endDate,
    activity,
    creatorId,
    spots,
    genderSplit,
    minAge,
    maxAge,
    latitude,
    longitude,
  } = req.body;

  try {
    // --- walidacje dat ---
    const parsedStart = new Date(startDate);
    const parsedEnd = new Date(endDate);
    const now = new Date();

    if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
      return res.status(400).json({ error: "Nieprawidłowy format daty." });
    }
    if (parsedStart <= now) {
      return res.status(400).json({ error: "Data rozpoczęcia musi być w przyszłości." });
    }
    if (parsedEnd <= parsedStart) {
      return res.status(400).json({ error: "Data zakończenia musi być po rozpoczęciu." });
    }

    const creatorIdNum = Number(creatorId);

    // --- pobierz dane twórcy (do snapshotu i treści powiadomień) ---
    const creator = await prisma.user.findUnique({
      where: { id: creatorIdNum },
      select: {
        userName: true,
        avatarUrl: true,
        customNotifyEnabled: true,
        customNotifyLat: true,
        customNotifyLng: true,
        lastDeviceLat: true,
        lastDeviceLng: true,
      },
    });

    if (!creator) {
      return res.status(404).json({ error: "Twórca wydarzenia nie istnieje." });
    }

    // --- snapshot lokalizacji twórcy w momencie tworzenia wydarzenia ---
    // reguła: jeśli creator.customNotifyEnabled → bierz custom; w przeciwnym razie lastDevice
    let creatorLatAtCreate: number | null = null;
    let creatorLngAtCreate: number | null = null;

    if (creator.customNotifyEnabled && creator.customNotifyLat != null && creator.customNotifyLng != null) {
      creatorLatAtCreate = creator.customNotifyLat;
      creatorLngAtCreate = creator.customNotifyLng;
    } else if (creator.lastDeviceLat != null && creator.lastDeviceLng != null) {
      creatorLatAtCreate = creator.lastDeviceLat;
      creatorLngAtCreate = creator.lastDeviceLng;
    }
    // jeśli twórca nie ma żadnej lokalizacji — snapshot pozostaje null (zajmie się tym logika selekcji powiadomień)

    // --- utworzenie eventu ---
    const event = await prisma.event.create({
      data: {
        location,
        address,
        startDate: parsedStart,
        endDate: parsedEnd,
        activity,
        creatorId: creatorIdNum,
        maxParticipants: Number(spots),
        genderBalance: !!genderSplit,
        minAge: typeof minAge === "number" ? minAge : minAge ? Number(minAge) : null,
        maxAge: typeof maxAge === "number" ? maxAge : maxAge ? Number(maxAge) : null,
        latitude: latitude != null ? Number(latitude) : null,
        longitude: longitude != null ? Number(longitude) : null,
        // ⬇️ snapshot twórcy
        creatorLatAtCreate,
        creatorLngAtCreate,
      },
    });

    // --- dane twórcy (do treści powiadomień) ---
    const userName = creator.userName ?? "Użytkownik";
    const avatarUrl = creator.avatarUrl ?? null;

    // ilu już uczestników (do treści powiadomień)
    const joinedCount = await prisma.eventParticipant.count({
      where: { eventId: event.id },
    });

    // --- odbiorcy wg zainteresowań / wieku (bez twórcy) ---
    const interestedUsers = await prisma.user.findMany({
      where: {
        userInterests: { some: { activity } },
        ...(event.minAge != null && event.maxAge != null
          ? { age: { gte: event.minAge, lte: event.maxAge } }
          : {}),
        id: { not: creatorIdNum },
      },
      select: { id: true },
    });
    const userIds = interestedUsers.map((u) => u.id);

    // --- wysyłka push (FCM + Expo fallback) ---
    const fullAddress = address || location || "nieokreślona lokalizacja";

    await sendPushToUsers(userIds, {
      title: `${userName} zaprasza na ${activity}!`,
      body: `📍 ${fullAddress}\n👥 Uczestnicy: ${joinedCount} / ${spots}`,
      data: {
        eventId: event.id,
        activity,
        location: location ?? "",
        address: address ?? "",
        maxParticipants: String(spots ?? ""),
        creatorName: userName,
        creatorAvatar: avatarUrl ?? "",
      },
      sound: "default",
    });

    // --- zapis notyfikacji in-app (Twoja logika) ---
    await Promise.all(
      userIds.map((uid) =>
        prisma.notification.create({
          data: { userId: uid, message: `${userName} stworzył wydarzenie: ${activity}` },
        })
      )
    );

    res.status(201).json(event);
  } catch (err) {
    console.error("❌ Błąd tworzenia wydarzenia:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
};
