import { NextFunction, Request, Response } from "express";
import { login } from "../services/auth.loginService";

export const getLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    const user = await login(email, password);

    if (!user) {
      return res.status(401).json({ message: "Niepoprawny email lub hasło" });
    }

    return res.status(200).json({
      userId: user.id, // 👈 TU BYŁO BRAK
      userName: user.userName,
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
};
