// controllers/auth.controller.ts
import { NextFunction, Request, Response } from "express";
import { registerUser } from "../services/auth.registrationserice";

export const getRegister = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userName, email, password, confirmPassword, gender, age } = req.body;

    if (!userName || !email || !password) {
      return res.status(400).json({ message: "userName, email i hasło są wymagane." });
    }

    if (typeof confirmPassword !== "string" || confirmPassword.length === 0) {
      return res.status(400).json({ message: "Pole powtórz hasło jest wymagane." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Hasła nie są identyczne." });
    }

    const strongPw = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!strongPw.test(password)) {
      return res.status(400).json({ message: "Hasło musi mieć min. 8 znaków, 1 dużą literę i 1 cyfrę." });
    }

    await registerUser({ userName, email, password, gender, age });

    return res.status(201).json({
      message: "Użytkownik zarejestrowany. Sprawdź e-mail, aby zweryfikować konto.",
    });
  } catch (error) {
    next(error);
  }
};
