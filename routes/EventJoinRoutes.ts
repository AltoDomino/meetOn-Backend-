import express from "express";
import { joinEventController } from "../controllers/EventJoinController";

const router = express.Router();

router.post("/join", joinEventController);

export default router;
