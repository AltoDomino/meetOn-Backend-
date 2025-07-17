import express from "express";
import { createEventController } from "../controllers/createEventController";
import { deleteEventController } from "../controllers/DeleteEventController";
import { getEventDetailsController } from "../controllers/GetEventDetailsController";
import { getJoinedEventsController } from "../controllers/getJoinedEventsController";

const router = express.Router();
router.get("/joined", getJoinedEventsController);
router.post("/create", createEventController);
router.delete("/:eventId", deleteEventController);
router.get("/:id/details", getEventDetailsController);

export default router;
