import { Request, Response } from "express";
import { joinEvent } from "../services/Event/EventJoinService"

export const joinEventController = async (req: Request, res: Response) => {
  const { userId, eventId } = req.body;

  if (!userId || !eventId) {
    return res.status(400).json({ error: "Brakuje userId lub eventId." });
  }

  try {
    const result = await joinEvent(Number(userId), Number(eventId));
    res.status(200).json(result);
  } catch (err: any) {
    console.error("❌ Błąd dołączania:", err);
    res.status(403).json({ error: err.message });
  }
};
