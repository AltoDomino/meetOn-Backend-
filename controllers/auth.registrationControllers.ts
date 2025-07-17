import { NextFunction, Request, Response } from "express";
import { register } from "../services/auth.registrationserice";
import { sendVerificationEmail } from "../services/auth.verification.service";

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

    // Rejestracja użytkownika
    const user = await register(userName, email, password, gender, age);

   await sendVerificationEmail(email, user.id.toString());

    res.status(201).json({
      message: "Użytkownik zarejestrowany. Sprawdź e-mail, aby zweryfikować konto.",
    });
  } catch (error) {
    next(error);
  }
};
