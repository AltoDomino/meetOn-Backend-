import express from "express";
import { forgotPasswordController } from "../controllers/forgotPasswordController"; // dopasuj nazwę pliku  // jeśli dodasz

const router = express.Router();

router.post("/forgot-password", forgotPasswordController);

export default router;
