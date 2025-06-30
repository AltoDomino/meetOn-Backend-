// controllers/UserInterest.ts

import { Request, Response } from "express";
import { saveUserInterests, getUserInterests } from "../services/UserInterest";

export const saveInterestsController = async (req: Request, res: Response) => {
  const userId = Number(req.params.userId);
  const { interests } = req.body;

  if (!userId || !Array.isArray(interests)) {
    return res.status(400).json({ error: "Brakuje danych wejściowych" });
  }

  try {
    await saveUserInterests(userId, interests);
    return res.status(200).json({ message: "Zainteresowania zapisane" });
  } catch (error) {
    console.error("❌ Błąd zapisu zainteresowań:", error);
    return res.status(500).json({ error: "Wewnętrzny błąd serwera" });
  }
};

export const getInterestsController = async (req: Request, res: Response) => {
  const userId = Number(req.params.userId);

  if (!userId) {
    return res.status(400).json({ error: "Brakuje userId" });
  }

  try {
    const interests = await getUserInterests(userId);
    return res.status(200).json(interests);
  } catch (error) {
    console.error("Błąd pobierania zainteresowań:", error);
    return res.status(500).json({ error: "Błąd serwera" });
  }
};
