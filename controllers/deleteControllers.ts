import { Request, Response } from "express";
import { deleteUserAccount } from "../services/deleteService";


export const deleteAccountController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Brak autoryzacji" });
    }

    await deleteUserAccount(userId);

    return res.json({ success: true, message: "Konto zostało usunięte." });
  } catch (err) {
    console.error("❌ Błąd usuwania konta:", err);
    return res.status(500).json({ error: "Błąd usuwania konta" });
  }
};
