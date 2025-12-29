import { Request, Response } from "express";
import { completeRegistrationService } from "../services/completeRegistration.service";

export async function completeRegistrationController(req: Request, res: Response) {
  try {
    // jeśli masz authMiddleware, tu będzie user z JWT:
    const authUserId = (req as any).user?.id as number | undefined;

    const {
      userId: bodyUserId,
      age,
      gender,
      dateOfBirth,
      description,
    } = req.body;

    const userId = authUserId ?? bodyUserId;

    if (!userId) {
      return res.status(401).json({ error: "Brak userId (JWT lub body)" });
    }

    if (!age || !gender) {
      return res
        .status(400)
        .json({ error: "Brak wymaganych danych (age, gender)" });
    }

    const user = await completeRegistrationService(Number(userId), {
      age: Number(age),
      gender,
      dateOfBirth,
      description,
    });

    return res.json({
      success: true,
      userId: user.id,
      userName: user.userName,
      email: user.email,
      gender: user.gender,
      age: user.age,
      description: user.description,
      isPhoneVerified: user.isPhoneVerified,
      isRegistrationComplete: user.isRegistrationComplete,
    });
  } catch (err: any) {
    console.error("❌ completeRegistration error:", err);
    return res
      .status(500)
      .json({ error: err?.message ?? "Nie udało się uzupełnić profilu" });
  }
}
