import express from "express";
import { getRegister } from "../controllers/auth.registrationControllers";

const router = express.Router();

router.post("/", getRegister);


export default router;