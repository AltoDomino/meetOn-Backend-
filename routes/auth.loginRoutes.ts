import express from "express";
import { getLogin } from "../controllers/auth.loginControllers";

const router = express.Router();

router.post("/", getLogin);

export default router;