import express from "express";
import {
  getLogin,
  googleLogin,
  appleLogin,
} from "../controllers/auth.loginControllers";
import { completeRegistration } from "../controllers/completeRegistrationController";
import {
  forgotPasswordController,
  resetPasswordController,
} from "../controllers/forgotPasswordController";
import { resetPasswordPageController } from "../controllers/resetPasswordPage.controller";

const router = express.Router();

// =====================================
// AUTH / LOGIN
// =====================================

// 📌 Klasyczne logowanie (email + hasło)
router.post("/", getLogin);

// 📌 Logowanie przez Google
router.post("/google", googleLogin);

// 📌 Logowanie przez Apple
router.post("/apple", appleLogin);

// 📌 Uzupełnianie profilu po logowaniu przez Google/Apple
router.post("/complete-registration", completeRegistration);

// =====================================
// RESET HASŁA
// =====================================

// 1️⃣ Zapomniane hasło – wysyłka maila
// POST /api/login/forgot-password
router.post("/forgot-password", forgotPasswordController);

// 2️⃣ STRONA HTML resetu hasła (link z maila)
// GET /api/login/reset-password?token=...
router.get("/reset-password", resetPasswordPageController);

// 3️⃣ Faktyczna zmiana hasła (API)
// POST /api/login/reset-password
router.post("/reset-password", resetPasswordController);

export default router;
