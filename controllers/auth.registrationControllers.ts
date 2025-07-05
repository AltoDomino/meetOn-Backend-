
import { NextFunction, Request, Response } from "express";
import { register } from "../services/auth.registrationserice";

export const getRegister = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userName, email, password, gender, age } = req.body;

    if (!userName || !email || !password || !gender || !age) {
      return res.status(400).json({ message: "Wszystkie pola są wymagane." });
    }

    const user = await register(userName, email, password, gender,age);
    res.status(201).json({ message: "Użytkownik zarejestrowany", user });
  } catch (error) {
    next(error);
  }
};
