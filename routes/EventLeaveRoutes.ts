import express from "express";
import { leaveEventController } from "../controllers/EventLeaveController";

const router = express.Router();

router.post("/leave", leaveEventController);

export default router;
