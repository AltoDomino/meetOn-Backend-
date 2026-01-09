// src/controllers/ratingController.ts
import { Request, Response } from "express";
import { z } from "zod";
import { completeEventForUser } from "../services/rankService";
import { saveRatingsForEvent } from "../services/ratingService";

const ratingsBodySchema = z.object({
  raterId: z.number().int().positive(), // ✅ zamiast req.user
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

    const { raterId, ratings } = ratingsBodySchema.parse(req.body);

    // 1) oznacz event jako zakończony dla usera (weryfikuje, czy był uczestnikiem)
    await completeEventForUser({ userId: raterId, eventId });

    // 2) zapisz oceny
    await saveRatingsForEvent({
      eventId,
      raterId,
      ratings,
    });

    return res.json({ success: true });
  } catch (e: any) {
    const msg = e?.message ?? "ERROR";

    const map: Record<string, number> = {
      EVENT_NOT_FOUND: 404,
      EVENT_NOT_FINISHED: 409,
      NOT_A_PARTICIPANT: 403,
    };

    const status = map[msg] ?? 400;
    return res.status(status).json({ error: msg });
  }
}
