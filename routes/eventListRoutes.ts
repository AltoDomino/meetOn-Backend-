// routes/eventListRoutes.ts
import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        creator: {
          select: { userName: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json(events);
  } catch (err) {
    console.error("Błąd pobierania wydarzeń:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

export default router;
