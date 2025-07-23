import { Request, Response, NextFunction } from "express";
import { verifyEmail } from "../services/auth.verification.service";

export const verifyEmailController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: "Token jest wymagany i musi być tekstem." });
    }

    const result = await verifyEmail(token);

    res.json(result);
  } catch (err) {
    next(err);
  }
};
