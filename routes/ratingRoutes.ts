import { Router } from "express";
import { postEventRatings, getEventRatings } from "../controllers/ratingController";

const router = Router();

router.post("/events/:eventId/ratings", postEventRatings);
router.get("/events/:eventId/ratings", getEventRatings);

export default router;
