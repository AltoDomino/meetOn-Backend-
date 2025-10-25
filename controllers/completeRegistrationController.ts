import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const completeRegistration = async (req: Request, res: Response) => {
  try {
    const { userId, age, gender, description } = req.body;

    await prisma.user.update({
      where: { id: userId },
      data: {
        age,
        gender,
        isRegistrationComplete: true,
      },
    });

    res.status(200).json({ message: "Registration completed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};
