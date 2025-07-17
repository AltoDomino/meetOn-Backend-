import express from "express";
import { leaveEventController } from "../controllers/EventLeaveController";

const router = express.Router();

router.post("/", leaveEventController);

export default router;
