import { Router } from "express";
import {
  sendCodeController,
  verifyCodeController,
} from "../controllers/phoneVerification.controller";

const router = Router();

router.post("/send-code", sendCodeController);
router.post("/verify-code", verifyCodeController);

export default router;
