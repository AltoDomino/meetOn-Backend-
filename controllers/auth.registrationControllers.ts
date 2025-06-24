
import { NextFunction, Request, Response } from "express";
import { register } from "../services/auth.registrationserice";

export const getRegister =  async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userName,email, password } = req.body;

    if (!userName || !email || !password) {
      return res.status(400).json({ message: "Wszystkie pola są wynmagane." });
    }

    const user = await register(userName,email, password);
    res.status(201).json({ message: "Użytkownik zarejestrowany", user });
  } catch (error) {
    next(error);
  }
};
