// controllers/auth.loginController.ts
import { NextFunction, Request, Response } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import { login } from "../services/auth.loginService";

export const getLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const user = await login(email, password);

    if (!user) return res.status(401).json({ message: "Niepoprawny email lub hasło" });
    if (!user.isVerified) return res.status(403).json({ message: "Zweryfikuj e-mail przed zalogowaniem." });

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing");
      return res.status(500).json({ message: "Server misconfiguration" });
    }

    const secret = process.env.JWT_SECRET!;
    const DEFAULT_EXPIRES_IN = "7d" as const;

    const payload = { 
      id: user.id, 
      email: user.email, 
      userName: user.userName, 
      isAdmin: (user as any).isAdmin ?? false // jeśli masz kolumnę isAdmin w DB
    };

    const expiresIn: SignOptions["expiresIn"] =
      (process.env.JWT_EXPIRES as SignOptions["expiresIn"]) ?? DEFAULT_EXPIRES_IN;

    const token = jwt.sign(payload, secret, { expiresIn });

    return res.status(200).json({
      userId: user.id,
      userName: user.userName,
      email: user.email,
      token,
    });
  } catch (err) {
    next(err);
  }
};
