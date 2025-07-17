import { Request, Response } from "express";
import { leaveEvent } from "../services/Event/EventLeaveService";
import { io } from "../socket";

export const leaveEventController = async (req: Request, res: Response) => {
  const { userId, eventId } = req.body;

  if (!userId || !eventId) {
    return res.status(400).json({ error: "Brakuje userId lub eventId." });
  }

  try {
    const result = await leaveEvent(Number(userId), Number(eventId));

    // Emituj do pokoju eventu info o zmianie uczestników
    io.to(eventId.toString()).emit("participantLeft", { userId, eventId });

    res.status(200).json(result);
  } catch (err: any) {
    console.error("❌ Błąd opuszczania wydarzenia:", err);
    res.status(403).json({ error: err.message });
  }
};
