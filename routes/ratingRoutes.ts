import { Router } from "express";
import {
  postEventRatings,
  getEventRatings,
  getUserRatingsStatsController,
} from "../controllers/ratingController";

const router = Router();

// Event
router.post("/events/:eventId/ratings", postEventRatings);
router.get("/events/:eventId/ratings", getEventRatings);

// ✅ PROFIL USERA
router.get("/users/:userId/ratings-stats", getUserRatingsStatsController);

export default router;
