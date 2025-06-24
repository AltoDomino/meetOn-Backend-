import express from "express";
import { createEventController } from "../controllers/createEventController";

const router = express.Router();

router.post("/", createEventController);

export default router;
