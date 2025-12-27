import { Request, Response } from "express";
import { sendVerificationCode, verifyCode } from "../services/phoneVerification";

export async function sendCodeController(req: Request, res: Response) {
  try {
    // 🔥🔥🔥 TU DODAJEMY DEBUG LOG
    console.log("🔥🔥🔥 WESZŁO DO sendCodeController", req.body);

    const { phoneNumber, userId } = req.body;

    if (!phoneNumber) return res.status(400).json({ error: "Brak numeru telefonu" });
    if (!userId) return res.status(400).json({ error: "Brak userId" });

    const result = await sendVerificationCode(Number(userId), String(phoneNumber));
    return res.json(result);
  } catch (err: any) {
    console.error("❌ sendCodeController error:", err); // <- też dopisałem
    return res.status(500).json({ error: err.message ?? "Server error" });
  }
}

export async function verifyCodeController(req: Request, res: Response) {
  try {
    console.log("🔐 verifyCodeController BODY:", req.body);

    const { phoneNumber, code, userId } = req.body;

    if (!phoneNumber || !code) return res.status(400).json({ error: "Brak danych" });
    if (!userId) return res.status(400).json({ error: "Brak userId" });

    const result = await verifyCode(Number(userId), String(phoneNumber), String(code));
    return res.json(result);
  } catch (err: any) {
    console.error("❌ verifyCodeController error:", err);
    return res.status(400).json({ error: err.message ?? "Bad request" });
  }
}
