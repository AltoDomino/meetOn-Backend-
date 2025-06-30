import express from "express";
import {
  saveInterestsController,
  getInterestsController,
} from "../controllers/UserInterest";

const router = express.Router();

router.patch("/:userId", saveInterestsController);
router.get("/:userId", getInterestsController);

export default router;
