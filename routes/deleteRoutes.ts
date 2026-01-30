import { Router } from "express";
import { deleteAccountController } from "../controllers/deleteControllers";

const router = Router();

router.delete("/account", deleteAccountController);

export default router;
