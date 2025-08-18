// controllers/auth.controller.ts
import { NextFunction, Request, Response } from "express";
import { registerUser } from "../services/auth.registrationserice";

export const postRegister = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userName, email, password, confirmPassword, gender, age } = req.body ?? {};

    // normalizacja
    const u = (userName ?? "").trim();
    const e = (email ?? "").trim().toLowerCase();
    const g = gender === "male" || gender === "female" ? gender : null;

    // walidacje bazowe
    if (!u || !e || !password) {
      return res.status(400).json({ message: "userName, email i hasło są wymagane." });
    }

    if (u.length > 8) {
      return res.status(400).json({ message: "Login może mieć maksymalnie 8 znaków." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(e)) {
      return res.status(400).json({ message: "Nieprawidłowy adres e-mail." });
    }

    if (typeof confirmPassword !== "string" || confirmPassword.length === 0) {
      return res.status(400).json({ message: "Pole powtórz hasło jest wymagane." });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Hasła nie są identyczne." });
    }

    const strongPw = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!strongPw.test(password)) {
      return res.status(400).json({
        message: "Hasło musi mieć min. 8 znaków, 1 dużą literę i 1 cyfrę.",
      });
    }

    if (g === null) {
      return res.status(400).json({ message: "Wybór płci jest wymagany." });
    }

    if (age != null) {
      const n = Number(age);
      if (!Number.isInteger(n) || n < 13 || n > 100) {
        return res.status(400).json({ message: "Nieprawidłowy wiek." });
      }
    }

    await registerUser({ userName: u, email: e, password, gender: g, age });

    return res
      .status(201)
      .json({ message: "Użytkownik zarejestrowany. Sprawdź e-mail, aby zweryfikować konto." });
  } catch (error) {
    next(error); // HttpError(409, ...) zostanie zamieniony na 409 przez globalny handler
  }
};
