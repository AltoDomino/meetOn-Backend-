import { Request, Response } from "express";
import {
  sendVerificationCode,
  verifyCode,
} from "../services//phoneVerification";

export async function sendCodeController(req: Request, res: Response) {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ error: "Brak numeru telefonu" });

    const result = await sendVerificationCode(phoneNumber);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function verifyCodeController(req: Request, res: Response) {
  try {
    const { phoneNumber, code } = req.body;
    if (!phoneNumber || !code)
      return res.status(400).json({ error: "Brak danych" });

    const result = await verifyCode(phoneNumber, code);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
