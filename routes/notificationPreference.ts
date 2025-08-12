// routes/notificationPrefs.routes.ts
import express from "express";
import { updateNotifyPrefs, getNotifyPrefs } from "../controllers/notificationPreference";
import { requireAuth } from "../middleware/auth"; // 👈 prawdziwy middleware

const router = express.Router();

router.put("/:id/notification-prefs", requireAuth, updateNotifyPrefs);
router.get("/:id/notification-prefs", requireAuth, getNotifyPrefs);

export default router;
