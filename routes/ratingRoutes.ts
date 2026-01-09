import { Router } from "express";
import { postEventRatings } from "../controllers/ratingController";

const router = Router();


router.post("/events/:eventId/ratings", postEventRatings);

export default router;
