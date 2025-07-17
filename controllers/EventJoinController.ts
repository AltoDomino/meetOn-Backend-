import { Request, Response } from "express";
import { joinEvent } from "../services/Event/EventJoinService";
import { io } from "../socket";

export const joinEventController = async (req: Request, res: Response) => {
  const { userId, eventId } = req.body;

  if (!userId || !eventId) {
    return res.status(400).json({ error: "Brak userId lub eventId" });
  }

  try {
    const result = await joinEvent(Number(userId), Number(eventId));

    // Emituj aktualizację do wszystkich w pokoju wydarzenia
    io.to(eventId.toString()).emit("participantJoined", { userId, eventId });

    res.status(201).json(result);
  } catch (error: any) {
    console.error("❌ Błąd dołączania do wydarzenia:", error);
    res.status(500).json({ error: error.message });
  }
};
