import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

type JwtPayload = {
  id: number;
  userId?: number;
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization || "";
    console.log("🔐 AUTH HEADER:", authHeader);

    if (!authHeader.startsWith("Bearer ")) {
      console.warn("⛔ Brak Bearer token");
      return res.status(401).json({ error: "Brak autoryzacji" });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      console.warn("⛔ Pusty token");
      return res.status(401).json({ error: "Brak autoryzacji" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("⛔ Brak JWT_SECRET w env");
      return res.status(500).json({ error: "Brak konfiguracji JWT" });
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;

    // zależnie jak kodujesz token:
    const id = Number(decoded.id ?? decoded.userId);

    if (!id) {
      console.warn("⛔ Token bez id/userId:", decoded);
      return res.status(401).json({ error: "Brak autoryzacji" });
    }

    (req as any).user = { id };
    console.log("✅ req.user ustawione:", (req as any).user);

    next();
  } catch (err) {
    console.error("❌ JWT verify error:", err);
    return res.status(401).json({ error: "Brak autoryzacji" });
  }
};
