import { Request, Response } from "express";
import { z } from "zod";
import { completeEventForUser, getUserRankStats } from "../services/rankService";

const completeBody = z.object({
  eventId: z.number().int().positive(),
});
const idParam = z.object({
  userId: z.string().transform((v) => parseInt(v, 10)).pipe(z.number().int().positive()),
});

export async function getRank(req: Request, res: Response) {
  try {
    const { userId } = idParam.parse(req.params);
    // (opcjonalnie) egzekwuj, że userId === req.user.id
    const stats = await getUserRankStats(userId);
    res.json(stats);
  } catch (e: any) {
    res.status(400).json({ error: e.message ?? "Bad request" });
  }
}

export async function postComplete(req: Request, res: Response) {
  try {
    const { userId } = idParam.parse(req.params);
    const body = completeBody.parse(req.body);
    // (opcjonalnie) egzekwuj, że userId === req.user.id

    const result = await completeEventForUser({ userId, eventId: body.eventId });
    res.json(result);
  } catch (e: any) {
    const msg = e.message ?? "ERROR";
    const map: Record<string, number> = {
      EVENT_NOT_FOUND: 404,
      EVENT_NOT_FINISHED: 409,
      NOT_A_PARTICIPANT: 403,
    };
    res.status(map[msg] ?? 400).json({ error: msg });
  }
}
