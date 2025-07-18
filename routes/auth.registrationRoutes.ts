import express from "express";
import { getRegister } from "../controllers/auth.registrationControllers";
import { verifyEmail } from "../controllers/auth.verification.controller";

const router = express.Router();

router.post("/", getRegister);

export default router;