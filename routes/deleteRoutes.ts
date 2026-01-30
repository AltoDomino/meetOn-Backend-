import { Router } from "express";
import { deleteAccountController } from "../controllers/deleteControllers";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.delete("/account", authMiddleware, deleteAccountController);

export default router;
