import { Request, Response } from "express";
import {
  forgotPasswordService,
  resetPasswordService,
} from "../services/forgotPassword.service";

export const forgotPasswordController = async (req: Request, res: Response) => {
  try {
    const emailRaw = req.body?.email;
    const email =
      typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";

    // celowo 200 (nie zdradzamy)
    if (!email || !email.includes("@")) {
      return res.status(200).json({ ok: true });
    }

    await forgotPasswordService({ email });

    return res.status(200).json({ ok: true });
  } catch {
    // celowo 200 (nie zdradzamy)
    return res.status(200).json({ ok: true });
  }
};

export const resetPasswordController = async (req: Request, res: Response) => {
  try {
    const tokenRaw = req.body?.token;
    const newPasswordRaw = req.body?.newPassword;

    const token = typeof tokenRaw === "string" ? tokenRaw.trim() : "";
    const newPassword =
      typeof newPasswordRaw === "string" ? newPasswordRaw : "";

    if (!token || token.length < 10) {
      return res.status(400).json({ message: "Nieprawidłowy token." });
    }

    if (!newPassword || newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "Hasło musi mieć co najmniej 8 znaków." });
    }

    await resetPasswordService({ token, newPassword });

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res
      .status(400)
      .json({ message: e?.message ?? "Nie udało się zresetować hasła." });
  }
};
