import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getUserNotifications = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: Number(userId) },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Błąd podczas pobierania powiadomień:", error);
    res.status(500).json({ error: "Błąd serwera" });
  }
};
