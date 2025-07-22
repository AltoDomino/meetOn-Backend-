import { NextFunction, Request, Response } from "express";
import { registerUser } from "../services/auth.registrationserice";

export const getRegister = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userName, email, password, gender, age } = req.body;

    if (!userName || !email || !password) {
      return res.status(400).json({ message: "userName, email i hasło są wymagane." });
    }

    await registerUser({ userName, email, password, gender, age });

    res.status(201).json({
      message: "Użytkownik zarejestrowany. Sprawdź e-mail, aby zweryfikować konto.",
    });
  } catch (error) {
    next(error);
  }
};
