import express from "express";
import { updateUserProfile, getUserProfile } from "../controllers/SettingsController";

const router = express.Router();

router.put("/profile", updateUserProfile);
router.get("/profile/:id", getUserProfile); 

export default router;
