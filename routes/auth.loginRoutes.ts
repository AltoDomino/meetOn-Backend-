import express from "express";
import { getLogin, googleLogin, appleLogin } from "../controllers/auth.loginControllers";
import { completeRegistration } from "../controllers/completeRegistrationController";

const router = express.Router();

// 📌 Klasyczne logowanie (email + hasło)
router.post("/", getLogin);

// 📌 Logowanie przez Google
router.post("/google", googleLogin);

// 📌 Logowanie przez Apple
router.post("/apple", appleLogin);

// 📌 Uzupełnianie profilu po logowaniu przez Google/Apple
router.post("/complete-registration", completeRegistration);

export default router;
