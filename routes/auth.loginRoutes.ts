import express from "express";
import { getLogin, googleLogin, appleLogin } from "../controllers/auth.loginControllers";

const router = express.Router();

// 📌 Logowanie klasyczne (email + hasło)
router.post("/", getLogin);

// 📌 Logowanie przez Google
router.post("/google", googleLogin);

// 📌 Logowanie przez Apple
router.post("/apple", appleLogin);

export default router;
