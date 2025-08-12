// middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface JwtUserPayload {
  id: number;
  email: string;
  userName: string;
  isAdmin?: boolean;
}

export interface AuthRequest extends Request {
  user?: JwtUserPayload;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  try {
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing");
      return res.status(500).json({ error: "Server misconfiguration" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtUserPayload;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
