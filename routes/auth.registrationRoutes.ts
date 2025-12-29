import express from "express";
import { getRegister } from "../controllers/auth.registrationControllers";
import { completeRegistrationController } from "../controllers/completeRegistration.controller";

const router = express.Router();

router.post("/", getRegister);

router.post("/login/complete-registration",completeRegistrationController);

export default router;