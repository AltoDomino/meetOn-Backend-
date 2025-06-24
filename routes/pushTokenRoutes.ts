import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/", async (req, res) => {
  const { userId, token } = req.body;

  if (!userId || !token) {
    return res.status(400).json({ error: "Brakuje danych" });
  }

  try {
    const saved = await prisma.pushToken.upsert({
      where: { userId },
      update: { token },
      create: { userId, token },
    });

    res.status(200).json({ message: "Token zapisany", saved });
  } catch (error) {
    console.error("Błąd zapisu tokena:", error);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

export default router;
