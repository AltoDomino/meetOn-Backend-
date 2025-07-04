import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 📁 Ustawienia przechowywania plików
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: (arg0: null, arg1: string) => void) => {
    const dir = "./uploads/avatars";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req: any, file: { originalname: string; }, cb: (arg0: null, arg1: string) => void) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

// 📤 Middleware + logika
export const uploadAvatarController = [
  upload.single("avatar"),
  async (req: Request, res: Response) => {
    const userId = Number(req.body.userId);

    if (!req.file || !userId) {
      return res.status(400).json({ error: "Brakuje pliku lub userId." });
    }

    const relativePath = `/uploads/avatars/${req.file.filename}`;
    const avatarUrl = `${req.protocol}://${req.get("host")}${relativePath}`;

    try {
      await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl },
      });

      return res.status(200).json({ avatarUrl });
    } catch (error) {
      console.error("❌ Błąd aktualizacji avatara:", error);
      return res.status(500).json({ error: "Błąd serwera przy zapisie avatara." });
    }
  },
];
