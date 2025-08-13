// controllers/notificationPrefs.controller.ts
import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth";

const prisma = new PrismaClient();

const prefsSchema = z.object({
  notificationRadiusKm: z.coerce.number().int().min(1).max(10000),
  customNotifyEnabled: z.coerce.boolean(),
  customNotifyLat: z.number().min(-90).max(90).nullable().optional(),
  customNotifyLng: z.number().min(-180).max(180).nullable().optional(),
});

export async function updateNotifyPrefs(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.params.id);
    if (!Number.isFinite(userId)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    // tylko właściciel lub admin
    if (!req.user || (req.user.id !== userId && !req.user.isAdmin)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const parsed = prefsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Invalid body", details: parsed.error.flatten() });
    }

    let {
      notificationRadiusKm,
      customNotifyEnabled,
      customNotifyLat,
      customNotifyLng,
    } = parsed.data;

    // Opcjonalnie: jeśli ktoś wyśle > 10000, przytnij do 10000
    if (notificationRadiusKm > 10000) notificationRadiusKm = 10000;

    // Jeśli własny punkt jest wyłączony, współrzędne zerujemy
    if (!customNotifyEnabled) {
      customNotifyLat = null;
      customNotifyLng = null;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        notificationRadiusKm,        // np. 30, 100, 9999 (100+)
        customNotifyEnabled,
        customNotifyLat,
        customNotifyLng,
      },
      select: {
        id: true,
        notificationRadiusKm: true,
        customNotifyEnabled: true,
        customNotifyLat: true,
        customNotifyLng: true,
      },
    });

    return res.json({ ok: true, prefs: updated });
  } catch (err) {
    console.error("updateNotifyPrefs error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

export async function getNotifyPrefs(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.params.id);
    if (!Number.isFinite(userId)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    if (!req.user || (req.user.id !== userId && !req.user.isAdmin)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        notificationRadiusKm: true,
        customNotifyEnabled: true,
        customNotifyLat: true,
        customNotifyLng: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ prefs: user });
  } catch (err) {
    console.error("getNotifyPrefs error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
