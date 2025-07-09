import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const updateUserProfile = async (req: Request, res: Response) => {
  const { userId, userName, description,password } = req.body;

  if (!userId) return res.status(400).json({ error: "Brak userId" });

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        userName,
        description,
      },
    });

    res.status(200).json(updatedUser);
  } catch (err) {
    console.error("❌ Błąd aktualizacji użytkownika:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  const userId = Number(req.params.id);
  if (!userId) return res.status(400).json({ error: "Brak ID użytkownika" });

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, userName: true, avatarUrl: true, description: true },
    });

    if (!user) return res.status(404).json({ error: "Użytkownik nie istnieje" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Błąd serwera" });
  }
};
