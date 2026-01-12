import { Request, Response } from "express";
import { z } from "zod";
import { completeEventForUser } from "../services/rankService";
import { saveRatingsForEvent, getEventRatingsStats } from "../services/ratingService";

const ratingsBodySchema = z.object({
  raterId: z.number().int().positive(),
  ratings: z.array(
    z.object({
      rateeId: z.number().int().positive(),
      stars: z.number().int().min(1).max(5),
      tags: z.array(z.string()).max(10).default([]),
    })
  ).min(1),
});

const querySchema = z.object({
  onlyThisEvent: z.string().optional().transform((v) => v === "true"),
});

export async function postEventRatings(req: Request, res: Response) {
  try {
    const eventId = Number(req.params.eventId);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({ error: "Invalid eventId" });
    }

    const { raterId, ratings } = ratingsBodySchema.parse(req.body);

    await completeEventForUser({ userId: raterId, eventId });

    await saveRatingsForEvent({ eventId, raterId, ratings });

    return res.json({ success: true });
  } catch (e: any) {
    const msg = e?.message ?? "ERROR";
    const map: Record<string, number> = {
      EVENT_NOT_FOUND: 404,
      EVENT_NOT_FINISHED: 409,
      NOT_A_PARTICIPANT: 403,
    };
    return res.status(map[msg] ?? 400).json({ error: msg });
  }
}

export async function getEventRatings(req: Request, res: Response) {
  try {
    const eventId = Number(req.params.eventId);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({ error: "Invalid eventId" });
    }

    const { onlyThisEvent } = querySchema.parse(req.query);

    const data = await getEventRatingsStats({ eventId, onlyThisEvent });

    return res.json(data);
  } catch (e: any) {
    return res.status(400).json({ error: e?.message ?? "ERROR" });
  }
}
