import express from "express";
import { createEventController } from "../controllers/createEventController";
import { deleteEventController } from "../controllers/DeleteEventController";
import { getEventDetailsController } from "../controllers/GetEventDetailsController";

const router = express.Router();

router.post("/create", createEventController);
router.delete("/:eventId", deleteEventController);
router.get("/:id/details", getEventDetailsController);

export default router;
