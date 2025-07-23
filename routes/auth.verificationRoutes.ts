import express from "express";
import { verifyEmailController } from "../controllers/auth.verificationLink.controller";

const router = express.Router();

router.get("/verify-email", verifyEmailController); 

export default router;
