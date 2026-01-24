import { Request, Response } from "express";
import {
  forgotPasswordService,
  resetPasswordService,
} from "../services/forgotPassword.service";

const now = () => new Date().toISOString();

const maskEmail = (email: string) => {
  const [user, domain] = email.split("@");
  if (!domain) return "***";
  const u = user.length <= 2 ? `${user[0] ?? ""}*` : `${user.slice(0, 2)}***`;
  return `${u}@${domain}`;
};

export const forgotPasswordController = async (req: Request, res: Response) => {
  const start = Date.now();

  const emailRaw = req.body?.email;
  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";

  console.log("\n================ FORGOT CONTROLLER / START ================");
  console.log({
    time: now(),
    path: req.path,
    email: email ? maskEmail(email) : null,
    hasBody: !!req.body,
  });

  // celowo 200 (nie zdradzamy)
  if (!email || !email.includes("@")) {
    console.log("FORGOT CONTROLLER / INVALID EMAIL (return 200)", {
      time: now(),
      ms: Date.now() - start,
    });
    return res.status(200).json({ ok: true });
  }

  try {
    await forgotPasswordService({ email });

    console.log("FORGOT CONTROLLER / END OK", {
      time: now(),
      ms: Date.now() - start,
    });

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    // W PROD możesz wrócić do "always 200".
    // Na debug: logujemy i zwracamy 500, żebyś widział problem.
    console.error("❌ FORGOT CONTROLLER / ERROR", {
      time: now(),
      message: e?.message ?? String(e),
      name: e?.name,
      stack: e?.stack,
    });

    return res.status(500).json({ message: "Forgot password failed (debug)" });
  }
};

export const resetPasswordController = async (req: Request, res: Response) => {
  const start = Date.now();

  const tokenRaw = req.body?.token;
  const newPasswordRaw = req.body?.newPassword;

  const token = typeof tokenRaw === "string" ? tokenRaw.trim() : "";
  const newPassword = typeof newPasswordRaw === "string" ? newPasswordRaw : "";

  console.log("\n================ RESET CONTROLLER / START ================");
  console.log({
    time: now(),
    path: req.path,
    tokenLen: token?.length ?? 0,
    newPasswordLen: newPassword?.length ?? 0,
  });

  if (!token || token.length < 10) {
    console.log("RESET CONTROLLER / INVALID TOKEN", {
      time: now(),
      ms: Date.now() - start,
    });
    return res.status(400).json({ message: "Nieprawidłowy token." });
  }

  if (!newPassword || newPassword.length < 8) {
    console.log("RESET CONTROLLER / INVALID PASSWORD", {
      time: now(),
      ms: Date.now() - start,
    });
    return res.status(400).json({ message: "Hasło musi mieć co najmniej 8 znaków." });
  }

  try {
    await resetPasswordService({ token, newPassword });

    console.log("RESET CONTROLLER / END OK", {
      time: now(),
      ms: Date.now() - start,
    });

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("❌ RESET CONTROLLER / ERROR", {
      time: now(),
      message: e?.message ?? String(e),
      name: e?.name,
      stack: e?.stack,
    });

    return res.status(400).json({
      message: e?.message ?? "Nie udało się zresetować hasła.",
    });
  }
};
