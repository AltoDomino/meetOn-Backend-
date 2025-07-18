import express from "express";
import { verifyEmail } from "../controllers/auth.verification.controller";

const router = express.Router();

router.get("/verify-email", verifyEmail); 

export default router;
