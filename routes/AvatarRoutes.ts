import express from "express";
import { uploadAvatarController } from "../controllers/changeAvatar";

const router = express.Router();

router.post("/", uploadAvatarController);

export default router;