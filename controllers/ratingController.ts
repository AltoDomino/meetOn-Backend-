// src/controllers/ratingController.ts
import { Request, Response } from "express";
import { z } from "zod";
import { completeEventForUser } from "../services/rankService";
import { saveRatingsForEvent } from "../services/ratingService";

const ratingsBodySchema = z.object({
  ratings: z
    .array(
      z.object({
        rateeId: z.number().int().positive(),
        stars: z.number().int().min(1).max(5),
        tags: z.array(z.string()).max(10).default([]),
      })
    )
    .min(1),
});

export async function postEventRatings(req: Request, res: Response) {
  try {
    const eventId = Number(req.params.eventId);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({ error: "Invalid eventId" });
    }

    // zakładam, że masz authMiddleware i tam wsadzacie userId do req.user.id
    const userId = (req as any).user?.id as number | undefined;
    if (!userId) {
      return res.status(401).json({ error: "UNAUTHENTICATED" });
    }

    const { ratings } = ratingsBodySchema.parse(req.body);

    // 1️⃣ najpierw: oznacz event jako zakończony dla tego usera
    //    (ta funkcja już sprawdza: czy event istnieje, czy jest zakończony,
    //     czy user był uczestnikiem itd.)
    await completeEventForUser({ userId, eventId });

    // 2️⃣ dopiero potem: zapisz oceny
    await saveRatingsForEvent({
      eventId,
      raterId: userId,
      ratings,
    });

    res.json({ success: true });
  } catch (e: any) {
    const msg = e.message ?? "ERROR";

    // jeżeli rankService rzucił te same komunikaty co w postComplete:
    const map: Record<string, number> = {
      EVENT_NOT_FOUND: 404,
      EVENT_NOT_FINISHED: 409,
      NOT_A_PARTICIPANT: 403,
    };

    const status = map[msg] ?? 400;
    res.status(status).json({ error: msg });
  }
}
