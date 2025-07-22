import { NextFunction, Request, Response } from "express";
import { registerUser } from "../services/auth.registrationserice";

export const getRegister = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userName, email, password, gender, dateOfBirth, age } = req.body;

    if (!userName || !email || !password || !gender || !dateOfBirth || !age) {
      return res.status(400).json({ message: "Wszystkie pola są wymagane." });
    }

    const response = await registerUser({
      userName,
      email,
      password,
      gender,
      dateOfBirth,
      age,
    });

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};
