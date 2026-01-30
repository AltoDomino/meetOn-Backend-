import { Request, Response } from "express";
import { deleteUserAccount } from "../services/deleteService";

export const deleteAccountController = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);

    console.log("🗑️ deleteAccountController params.userId:", req.params.userId);
    console.log("🗑️ parsed userId:", userId);

    if (!userId) {
      return res.status(400).json({ error: "Brak userId" });
    }

    await deleteUserAccount(userId);

    return res.json({ success: true, message: "Konto zostało usunięte." });
  } catch (err) {
    console.error("❌ Błąd usuwania konta:", err);
    return res.status(500).json({ error: "Błąd usuwania konta" });
  }
};
